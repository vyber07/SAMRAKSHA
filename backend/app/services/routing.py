import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import structlog
from datetime import datetime
import httpx
import os

logger = structlog.get_logger()
OSRM_URL = os.getenv("OSRM_URL", "http://osrm:5000")

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
    If hotspots is empty, landmark waypoint fallbacks are generated so patrol units
    always receive valid route polylines.
    """
    if not patrol_units:
        return []

    if not hotspots:
        fallback_hotspots = []
        for unit in patrol_units:
            u_lat = unit.get('current_lat', 23.0225)
            u_lon = unit.get('current_lon', 72.5714)
            fallback_hotspots.extend([
                {
                    "ward": unit.get("ward", "Landmark Sector A"),
                    "risk_score": 50,
                    "lat": u_lat + 0.004,
                    "lon": u_lon + 0.004,
                    "is_landmark": True
                },
                {
                    "ward": unit.get("ward", "Landmark Sector B"),
                    "risk_score": 40,
                    "lat": u_lat - 0.004,
                    "lon": u_lon - 0.004,
                    "is_landmark": True
                }
            ])
        hotspots = fallback_hotspots
        
    try:
        # 1. Create Data Model
        data = {}
        
        # Locations: [Depots (current unit locations)] + [Hotspots]
        starts = []
        ends = []
        locations = []
        
        # Add unit starting points
        for i, unit in enumerate(patrol_units):
            locations.append((unit['current_lat'], unit['current_lon']))
            starts.append(i)
            ends.append(i) # End where they started
            
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
            url = f"{OSRM_URL}/table/v1/driving/{coords}?annotations=distance"
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
                
                if unit_route or patrol_units[vehicle_id].get('manual_waypoints'):
                    manual_wps = patrol_units[vehicle_id].get('manual_waypoints') or []
                    import json
                    if isinstance(manual_wps, str):
                        try:
                            manual_wps = json.loads(manual_wps)
                        except:
                            manual_wps = []
                            
                    for mw in manual_wps:
                        if isinstance(mw, dict) and 'lat' in mw and 'lon' in mw:
                            unit_route.append(mw)
                    
                    # Fetch dense polyline from OSRM for this ordered route
                    dense_path = []
                    all_pts = [(patrol_units[vehicle_id]['current_lat'], patrol_units[vehicle_id]['current_lon'])] + [(wp['lat'], wp['lon']) for wp in unit_route]
                    if len(all_pts) >= 2:
                        try:
                            coords = ";".join([f"{lon},{lat}" for lat, lon in all_pts])
                            url = f"{OSRM_URL}/route/v1/driving/{coords}?geometries=geojson&overview=full"
                            async with httpx.AsyncClient() as client:
                                r_resp = await client.get(url, timeout=5.0)
                                if r_resp.status_code == 200:
                                    r_data = r_resp.json()
                                    if r_data.get('code') == 'Ok':
                                        # GeoJSON uses [lon, lat], leaflet wants [lat, lon]
                                        dense_path = [[pt[1], pt[0]] for pt in r_data['routes'][0]['geometry']['coordinates']]
                        except Exception as e:
                            logger.error(f"Failed to fetch dense OSRM route: {e}")
                        if not dense_path:
                            dense_path = [[lat, lon] for lat, lon in all_pts]

                    routes.append({
                        "unit": patrol_units[vehicle_id],
                        "route": unit_route,
                        "distance_meters": route_distance,
                        "road_path": dense_path
                    })

        if not routes and patrol_units:
            for unit in patrol_units:
                u_lat = unit.get('current_lat', 23.0225)
                u_lon = unit.get('current_lon', 72.5714)
                wps = [{"lat": u_lat + 0.004, "lon": u_lon + 0.004}, {"lat": u_lat - 0.004, "lon": u_lon - 0.004}]
                all_pts = [(u_lat, u_lon)] + [(w['lat'], w['lon']) for w in wps]
                routes.append({
                    "unit": unit,
                    "route": wps,
                    "distance_meters": 1000,
                    "road_path": [[lat, lon] for lat, lon in all_pts]
                })

        return routes
    except Exception as e:
        logger.error(f"Routing optimization failed: {e}")
        routes = []
        for unit in patrol_units:
            u_lat = unit.get('current_lat', 23.0225)
            u_lon = unit.get('current_lon', 72.5714)
            wps = [{"lat": u_lat + 0.004, "lon": u_lon + 0.004}]
            all_pts = [(u_lat, u_lon), (u_lat + 0.004, u_lon + 0.004)]
            routes.append({
                "unit": unit,
                "route": wps,
                "distance_meters": 500,
                "road_path": [[lat, lon] for lat, lon in all_pts]
            })
        return routes
