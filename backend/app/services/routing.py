import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import structlog
from datetime import datetime
import httpx

logger = structlog.get_logger()

# Haversine distance for routing
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dLat = np.radians(lat2 - lat1)
    dLon = np.radians(lon2 - lon1)
    a = np.sin(dLat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dLon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

async def optimize_patrol_routes(patrol_units: list, hotspots: list) -> list:
    """
    Given a list of available patrol units and active hotspots, assign hotspots to units 
    and optimize their routes using Google OR-Tools (Vehicle Routing Problem).
    """
    if not patrol_units or not hotspots:
        return []
        
    try:
        # 1. Create Data Model
        data = {}
        
        # Locations: [Depots (current unit locations)] + [Hotspots]
        # For simplicity, we'll assign one "depot" per unit if possible, 
        # but OR-tools standard VRP uses a single depot.
        # To handle multiple unit starting locations without returning to them, 
        # we set up multiple depots (start and end nodes).
        
        starts = []
        ends = []
        locations = []
        
        # Add unit starting points
        for i, unit in enumerate(patrol_units):
            locations.append((unit['current_lat'], unit['current_lon']))
            starts.append(i)
            ends.append(i) # End where they started (or we can use dummy end nodes)
            
        num_units = len(patrol_units)
        
        # Add hotspots
        for hotspot in hotspots:
            locations.append((hotspot['lat'], hotspot['lon']))
            
        # Distance matrix
        num_locations = len(locations)
        distance_matrix = np.zeros((num_locations, num_locations))
        
        async def get_osrm_distance_matrix(locs: list) -> list:
            if len(locs) < 2:
                return None
            coords = ";".join([f"{lon},{lat}" for lat, lon in locs])
            url = f"http://osrm:5000/table/v1/driving/{coords}?annotations=distance"
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, timeout=5.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get('code') == 'Ok':
                            return data.get('distances')
            except Exception as e:
                logger.warning(f"OSRM API failed: {e}")
            return None

        osrm_distances = await get_osrm_distance_matrix(locations)
        if osrm_distances:
            for i in range(num_locations):
                for j in range(num_locations):
                    distance_matrix[i][j] = int(osrm_distances[i][j]) if osrm_distances[i][j] is not None else 0
        else:
            for i in range(num_locations):
                for j in range(num_locations):
                    if i == j:
                        distance_matrix[i][j] = 0
                    else:
                        dist = haversine_distance(
                            locations[i][0], locations[i][1],
                            locations[j][0], locations[j][1]
                        ) * 1000
                        distance_matrix[i][j] = int(dist)
                    
        data['distance_matrix'] = distance_matrix.tolist()
        data['num_vehicles'] = num_units
        data['starts'] = starts
        data['ends'] = ends
        
        # 2. Setup Routing Index Manager & Model
        manager = pywrapcp.RoutingIndexManager(
            len(data['distance_matrix']),
            data['num_vehicles'],
            data['starts'],
            data['ends']
        )
        routing = pywrapcp.RoutingModel(manager)
        
        # 3. Create and register a transit callback
        def distance_callback(from_index, to_index):
            # Returns the distance between the two nodes
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data['distance_matrix'][from_node][to_node]
            
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        
        # 4. Define cost of each arc
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # 5. Add Distance constraint
        dimension_name = 'Distance'
        routing.AddDimension(
            transit_callback_index,
            0,  # no slack
            30000,  # vehicle maximum travel distance (30km)
            True,  # start cumul to zero
            dimension_name
        )
        distance_dimension = routing.GetDimensionOrDie(dimension_name)
        distance_dimension.SetGlobalSpanCostCoefficient(100)
        
        # 6. Setting first solution heuristic
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.time_limit.seconds = 3
        
        # 7. Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        # 8. Extract solution
        routes = []
        if solution:
            for vehicle_id in range(data['num_vehicles']):
                index = routing.Start(vehicle_id)
                unit_route = []
                route_distance = 0
                while not routing.IsEnd(index):
                    node_index = manager.IndexToNode(index)
                    if node_index >= num_units: # It's a hotspot, not a depot
                        hotspot_idx = node_index - num_units
                        unit_route.append(hotspots[hotspot_idx])
                    
                    previous_index = index
                    index = solution.Value(routing.NextVar(index))
                    route_distance += routing.GetArcCostForVehicle(
                        previous_index, index, vehicle_id
                    )
                
                if unit_route:
                    routes.append({
                        "unit_id": patrol_units[vehicle_id]['id'],
                        "unit_name": patrol_units[vehicle_id]['unit_name'],
                        "waypoints": unit_route,
                        "distance_meters": route_distance
                    })
                    
        return routes
    except Exception as e:
        logger.error(f"Routing optimization failed: {e}")
        return []
