import pandas as pd
import numpy as np
import structlog

logger = structlog.get_logger()

# ─── Festival Calendar ─────────────────────────────────────────────────────────
# Maps event name → expected crime multipliers per crime type
# Used by /analytics/simulate for crowd-event risk modelling
FESTIVAL_CALENDAR = {
    'navratri': {
        'theft': 2.8, 'assault': 1.9, 'crowd_violence': 2.2,
        'pickpocketing': 3.5, 'eve_teasing': 2.0,
    },
    'diwali': {
        'theft': 2.5, 'burglary': 3.0, 'robbery': 2.2,
        'noise_complaint': 1.5, 'fire_incident': 2.0,
    },
    'uttarayan': {
        'kite_injury': 4.0, 'assault': 1.4, 'crowd_violence': 1.6,
        'theft': 1.8,
    },
    'eid': {
        'crowd_violence': 1.8, 'theft': 2.0, 'traffic_violation': 2.5,
    },
    'holi': {
        'eve_teasing': 3.0, 'assault': 2.2, 'theft': 1.9,
        'molestation': 2.5,
    },
    'ganesh_chaturthi': {
        'theft': 2.3, 'crowd_violence': 1.7, 'pickpocketing': 3.2,
        'traffic_violation': 2.0,
    },
    'ambedkar_jayanti': {
        'crowd_violence': 2.0, 'theft': 1.6, 'vandalism': 1.8,
    },
    'independence_day': {
        'security_threat': 3.0, 'crowd_violence': 1.5, 'theft': 1.4,
    },
    'rath_yatra': {
        'crowd_violence': 2.5, 'theft': 3.0, 'pickpocketing': 3.2, 'traffic_violation': 2.8,
    },
}

def compute_kde_heatmap(df: pd.DataFrame):
    if df.empty or len(df) < 3:
        return []
    
    # Simple KDE over lat/lon
    try:
        from scipy.stats import gaussian_kde
        x = df['lon'].values
        y = df['lat'].values
        # Calculate the point density
        xy = np.vstack([x, y])
        z = gaussian_kde(xy)(xy)
        
        # Sort the points by density, so that the densest points are plotted last
        idx = z.argsort()
        x, y, z = x[idx], y[idx], z[idx]
        
        # Normalize z to 0-1 range for heatmap intensity
        z_norm = (z - z.min()) / (z.max() - z.min() + 1e-9)
        
        return [
            {"lat": float(lat), "lon": float(lon), "intensity": float(intensity)}
            for lat, lon, intensity in zip(y, x, z_norm)
        ]
    except Exception as e:
        logger.error(f"KDE Heatmap computation failed: {e}")
        return []

def run_dbscan_clustering(df: pd.DataFrame):
    if df.empty or len(df) < 3:
        return []
        
    try:
        from sklearn.cluster import DBSCAN
        # Convert lat/lon to radians for Haversine distance
        coords = np.radians(df[['lat', 'lon']].values)
        
        # DBSCAN: eps 1km approx (1/6371 radians), min_samples=3
        db = DBSCAN(eps=1.0/6371.0, min_samples=3, algorithm='ball_tree', metric='haversine').fit(coords)
        
        df['cluster'] = db.labels_
        
        # Extract clusters
        clusters = []
        for cluster_id in set(db.labels_):
            if cluster_id == -1:
                continue # noise
                
            cluster_points = df[df['cluster'] == cluster_id]
            center_lat = cluster_points['lat'].mean()
            center_lon = cluster_points['lon'].mean()
            
            clusters.append({
                "cluster_id": int(cluster_id),
                "center_lat": float(center_lat),
                "center_lon": float(center_lon),
                "point_count": len(cluster_points)
            })
            
        return clusters
    except Exception as e:
        logger.error(f"DBSCAN clustering failed: {e}")
        return []

class RiskPredictor:
    def __init__(self):
        import xgboost as xgb
        self.model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5
        )
        self._is_trained = False
        
    async def train_if_needed(self, db):
        if not self._is_trained:
            from app.db.connection import fetch_all
            query = """
                SELECT EXTRACT(HOUR FROM timestamp) as hour,
                       EXTRACT(DOW FROM timestamp) as dow,
                       EXTRACT(MONTH FROM timestamp) as month,
                       severity
                FROM incidents
                WHERE ward IS NOT NULL
            """
            rows = await fetch_all(db, query)
            if rows and len(rows) > 10:
                df = pd.DataFrame(rows)
                X = df[['hour', 'dow', 'month']].values
                y = np.array([int(r) * 20 for r in df['severity']])
                self.model.fit(X, y)
                self._is_trained = True
            else:
                X_dummy = np.random.rand(100, 3) * [24, 6, 12]
                y_dummy = np.random.rand(100) * 100
                y_dummy += np.where(X_dummy[:, 0] < 6, 20, 0)
                y_dummy = np.clip(y_dummy, 0, 100)
                
                self.model.fit(X_dummy, y_dummy)
                self._is_trained = True
            
    async def predict_zone_risk(self, ward: str, hour: int, dow: int, month: int, db) -> float:
        await self.train_if_needed(db)
        
        ward_hash = hash(ward) % 100 / 100.0
        X = np.array([[hour, dow, month]])
        
        base_risk = float(self.model.predict(X)[0])
        risk = base_risk + (ward_hash * 10 - 5)
        
        return float(np.clip(risk, 0.0, 100.0))
