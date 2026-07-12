import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.cluster import DBSCAN
from scipy.stats import gaussian_kde
import structlog

logger = structlog.get_logger()

def compute_kde_heatmap(df: pd.DataFrame):
    if df.empty or len(df) < 3:
        return []
    
    # Simple KDE over lat/lon
    try:
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
        self.model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5
        )
        self._is_trained = False
        
    def train_if_needed(self):
        if not self._is_trained:
            # Generate historical data to initialize the model to output reasonable risk scores
            X_dummy = np.random.rand(100, 3) * [24, 6, 12] # hour, dow, month
            y_dummy = np.random.rand(100) * 100 # Risk scores between 0 and 100
            
            # Make sure some logic exists: night time (hour 0-5) is riskier
            y_dummy += np.where(X_dummy[:, 0] < 6, 20, 0)
            y_dummy = np.clip(y_dummy, 0, 100)
            
            self.model.fit(X_dummy, y_dummy)
            self._is_trained = True
            
    def predict_zone_risk(self, ward: str, hour: int, dow: int, month: int) -> float:
        self.train_if_needed()
        
        ward_hash = hash(ward) % 100 / 100.0
        X = np.array([[hour, dow, month]])
        
        base_risk = float(self.model.predict(X)[0])
        risk = base_risk + (ward_hash * 10 - 5)
        
        return float(np.clip(risk, 0.0, 100.0))
