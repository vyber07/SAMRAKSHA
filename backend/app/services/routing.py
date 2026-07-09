from ortools.constraint_solver import pywrapcp, routing_enums_pb2
import httpx
import math
import structlog
from datetime import datetime

logger = structlog.get_logger()

async def get_travel_time_matrix(locations: list) -> list[list[int]]:
    n = len(locations)
    matrix = [[0] * n for _ in range(n)]
    
    try:
        coords = ';'.join(f\"{loc['lon']},{loc['lat']}\" for loc in locations)
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"http://router.project-osrm.org/table/v1/driving/{coords}",
                params={'annotations': 'duration'}
            )
        data = resp.json()
        durations = data['durations']
        matrix = [[int(d) for d in row] for row in durations]
    except Exception:
        # Euclidean fallback (seconds estimate)
        for i in range(n):
            for j in range(n):
                if i != j:
                    dlat = locations[i]['lat'] - locations[j]['lat']
                    dlon = locations[i]['lon'] - locations[j]['lon']
                    dist_km = math.sqrt(dlat**2 + dlon**2) * 111
                    matrix[i][j] = int(dist_km / 30 * 3600)  # 30 km/h avg
    return matrix

async def optimize_patrol_routes(
    patrol_units: list,
    hotspots: list,
    shift_hours: int = 8
) -> list:
    n_units = len(patrol_units)
    if n_units == 0 or len(hotspots) == 0:
        return []
        
    try:
        # Depot: unit positions (0..n_units-1) + hotspots
        all_locations = [
            {'lat': u['current_lat'], 'lon': u['current_lon']}
            for u in patrol_units
        ] + hotspots
        
        n = len(all_locations)
        time_matrix = await get_travel_time_matrix(all_locations)
        
        manager = pywrapcp.RoutingIndexManager(n, n_units, list(range(n_units)))
        routing = pywrapcp.RoutingModel(manager)
        
        def time_callback(from_idx, to_idx):
            from_node = manager.IndexToNode(from_idx)
            to_node   = manager.IndexToNode(to_idx)
            return time_matrix[from_node][to_node]
        
        transit_cb = routing.RegisterTransitCallback(time_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)
        
        shift_seconds = shift_hours * 3600
        routing.AddDimension(transit_cb, 3600, shift_seconds, False, 'Time')
        time_dim = routing.GetDimensionOrDie('Time')
        
        # High risk zones must be visited within 2 hours
        for i, hs in enumerate(hotspots):
            if hs.get('risk_score', 0) > 75:
                idx = manager.NodeToIndex(n_units + i)
                time_dim.CumulVar(idx).SetRange(0, 7200)
        
        params = pywrapcp.DefaultRoutingSearchParameters()
        params.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        params.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        params.time_limit.seconds = 5
        
        solution = routing.SolveWithParameters(params)
        
        if not solution:
            # Fallback solution: round-robin assignment of hotspots
            routes = []
            for idx, unit in enumerate(patrol_units):
                unit_route = []
                # Give each unit some hotspots near it
                assigned_hs = hotspots[idx::n_units]
                cum_time = 0
                for h_idx, hs in enumerate(assigned_hs):
                    # compute approximate eta
                    cum_time += 15 * 60 # 15 mins per stop average
                    unit_route.append({
                        'ward': hs['ward'],
                        'lat': hs['lat'],
                        'lon': hs['lon'],
                        'risk': hs.get('risk_score', 0),
                        'eta_min': cum_time // 60
                    })
                routes.append({
                    'unit_id': unit['id'],
                    'unit_name': unit['unit_name'],
                    'route': unit_route
                })
            return routes
        
        routes = []
        for unit_idx in range(n_units):
            route = []
            idx = routing.Start(unit_idx)
            cumulative_time = 0
            
            while not routing.IsEnd(idx):
                node = manager.IndexToNode(idx)
                if node >= n_units:
                    hs_idx = node - n_units
                    cumulative_time += time_matrix[manager.IndexToNode(routing.Start(unit_idx))][node]
                    route.append({
                        'ward':     hotspots[hs_idx]['ward'],
                        'lat':      hotspots[hs_idx]['lat'],
                        'lon':      hotspots[hs_idx]['lon'],
                        'risk':     hotspots[hs_idx].get('risk_score', 0),
                        'eta_min':  cumulative_time // 60
                    })
                idx = solution.Value(routing.NextVar(idx))
            
            routes.append({
                'unit_id':   patrol_units[unit_idx]['id'],
                'unit_name': patrol_units[unit_idx]['unit_name'],
                'route':     route
            })
        
        return routes
    except Exception as e:
        logger.error("Routing optimization failed", error=str(e))
        # Simple fallback
        routes = []
        for idx, unit in enumerate(patrol_units):
            routes.append({
                'unit_id': unit['id'],
                'unit_name': unit['unit_name'],
                'route': []
            })
        return routes
