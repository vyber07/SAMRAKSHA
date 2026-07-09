import xgboost as xgb
import numpy as np
import pandas as pd
from scipy.stats import gaussian_kde
from sklearn.cluster import DBSCAN

FESTIVAL_CALENDAR = {
    'rath_yatra':  {'months':[6,7],  'theft':2.1,'snatching':1.8,'crowd':2.5},
    'navratri':    {'months':[9,10], 'harassment':1.9,'theft':1.6},
    'diwali':      {'months':[10,11],'burglary':1.7,'accident':2.0},
    'uttarayan':   {'months':[1],    'accident':2.3,'assault':1.3},
    'ipl_match':   {'months':[3,4,5],'drunk':2.0,'robbery':1.3},
}

AHMEDABAD_WARDS_CENTROIDS = {
    'Satellite':   (23.0300, 72.5100),
    'Bodakdev':    (23.0470, 72.5060),
    'Vastrapur':   (23.0370, 72.5290),
    'Ambawadi':    (23.0200, 72.5510),
    'Navrangpura': (23.0270, 72.5620),
    'Maninagar':   (22.9890, 72.6030),
    'Vatwa':       (22.9720, 72.6380),
    'Gomtipur':    (23.0380, 72.6260),
    'Jamalpur':    (23.0370, 72.6050),
    'Kalupur':     (23.0240, 72.5990),
    'Shahibaug':   (23.0600, 72.5900),
    'Chandkheda':  (23.1010, 72.5870),
    'Bopal':       (23.0170, 72.4680),
    'Ghatlodiya':  (23.0670, 72.5540),
    'Naranpura':   (23.0530, 72.5550),
    'Ellisbridge': (23.0225, 72.5714),
}

def get_festival_flag(month: int, day: int) -> bool:
    for event, data in FESTIVAL_CALENDAR.items():
        if month in data['months']:
            return True
    return False

def build_features(incidents_df: pd.DataFrame) -> pd.DataFrame:
    df = incidents_df.copy()
    if df.empty:
        return pd.DataFrame(columns=[
            'hour','day_of_week','month','is_night','is_weekend',
            'festival_flag','crimes_30d','crimes_7d','lat','lon'
        ])
    df['hour']         = pd.to_datetime(df['timestamp']).dt.hour
    df['day_of_week']  = pd.to_datetime(df['timestamp']).dt.dayofweek
    df['month']        = pd.to_datetime(df['timestamp']).dt.month
    df['is_night']     = df['hour'].apply(lambda h: 1 if (h >= 20 or h <= 5) else 0)
    df['is_weekend']   = df['day_of_week'].apply(lambda d: 1 if d >= 5 else 0)
    df['festival_flag']= df.apply(lambda r: get_festival_flag(r['month'], 1), axis=1).astype(int)
    
    # Historical density per ward
    df['crimes_30d']   = df.groupby('ward')['id'].transform(lambda x: x.rolling(30, min_periods=1).count())
    df['crimes_7d']    = df.groupby('ward')['id'].transform(lambda x: x.rolling(7, min_periods=1).count())
    return df[[
        'hour','day_of_week','month','is_night','is_weekend',
        'festival_flag','crimes_30d','crimes_7d','lat','lon'
    ]]

class RiskPredictor:
    def __init__(self):
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            eval_metric='logloss',
            tree_method='hist'
        )
        self.is_trained = False
        self.historical_counts = {}

    def train(self, incidents_df: pd.DataFrame):
        if len(incidents_df) < 10:
            # Not enough data to train a reliable XGBoost model
            self.is_trained = False
            return
        try:
            X = build_features(incidents_df)
            # Create a simple synthetic target: 1 if crime severity >= 3 else 0
            y = (incidents_df['severity'] >= 3).astype(int).values
            self.model.fit(X, y)
            self.is_trained = True
            
            # Store some historical stats for fallback
            for ward in AHMEDABAD_WARDS_CENTROIDS.keys():
                ward_data = incidents_df[incidents_df['ward'] == ward]
                self.historical_counts[ward] = {
                    '7d': len(ward_data[ward_data['timestamp'] >= pd.Timestamp.now() - pd.Timedelta(days=7)]),
                    '30d': len(ward_data[ward_data['timestamp'] >= pd.Timestamp.now() - pd.Timedelta(days=30)])
                }
        except Exception:
            self.is_trained = False

    def get_30d_count(self, ward: str) -> int:
        return self.historical_counts.get(ward, {}).get('30d', 5)

    def get_7d_count(self, ward: str) -> int:
        return self.historical_counts.get(ward, {}).get('7d', 2)

    def ward_centroid_lat(self, ward: str) -> float:
        return AHMEDABAD_WARDS_CENTROIDS.get(ward, (23.0225, 72.5714))[0]

    def ward_centroid_lon(self, ward: str) -> float:
        return AHMEDABAD_WARDS_CENTROIDS.get(ward, (23.0225, 72.5714))[1]

    def density_fallback(self, ward: str) -> float:
        # Simple density-based scoring
        count_7d = self.get_7d_count(ward)
        score = min(30.0 + count_7d * 10, 95.0)
        return round(score, 1)

    def predict_zone_risk(self, ward: str, hour: int, 
                          day_of_week: int, month: int) -> float:
        if not self.is_trained:
            return self.density_fallback(ward)
        
        try:
            features = np.array([[
                hour, day_of_week, month,
                1 if (hour >= 20 or hour <= 5) else 0,
                1 if day_of_week >= 5 else 0,
                1 if get_festival_flag(month, 1) else 0,
                self.get_30d_count(ward),
                self.get_7d_count(ward),
                self.ward_centroid_lat(ward),
                self.ward_centroid_lon(ward),
            ]])
            prob = self.model.predict_proba(features)[0][1]
            return round(float(prob) * 100, 1)
        except Exception:
            return self.density_fallback(ward)

def run_dbscan_clustering(incidents_df: pd.DataFrame) -> list:
    if len(incidents_df) < 5:
        return []
    try:
        coords = incidents_df[['lat','lon']].values
        clustering = DBSCAN(eps=0.01, min_samples=5).fit(coords)
        
        clusters = []
        for label in set(clustering.labels_):
            if label == -1:
                continue
            mask = clustering.labels_ == label
            cluster_points = incidents_df[mask]
            
            # Simple crime types dict
            crime_types = cluster_points['crime_type'].value_counts().to_dict()
            crime_types_converted = {str(k): int(v) for k, v in crime_types.items()}
            
            clusters.append({
                'cluster_id': int(label),
                'center_lat': float(cluster_points['lat'].mean()),
                'center_lon': float(cluster_points['lon'].mean()),
                'crime_count': int(mask.sum()),
                'crime_types': crime_types_converted,
                'radius_km': float(cluster_points[['lat','lon']].std().mean() * 111)
            })
        return sorted(clusters, key=lambda x: x['crime_count'], reverse=True)
    except Exception:
        return []

def compute_kde_heatmap(incidents_df: pd.DataFrame) -> list:
    if len(incidents_df) < 3:
        # Fallback to simple grids if not enough points for KDE covariance
        points = []
        for idx, row in incidents_df.iterrows():
            points.append({
                'lat': float(row['lat']),
                'lon': float(row['lon']),
                'intensity': float(row.get('severity', 3) / 5.0)
            })
        return points
        
    try:
        lats = incidents_df['lat'].values
        lons = incidents_df['lon'].values
        
        # Check if coordinates have variance
        if np.std(lats) < 1e-5 or np.std(lons) < 1e-5:
            return [{'lat': float(lat), 'lon': float(lon), 'intensity': 1.0} for lat, lon in zip(lats, lons)]
            
        kde = gaussian_kde(np.vstack([lats, lons]), bw_method=0.05)
        
        lat_range = np.linspace(22.9, 23.2, 40) # reduced resolution for speed
        lon_range = np.linspace(72.4, 72.7, 40)
        
        heatmap_points = []
        for lat in lat_range:
            for lon in lon_range:
                try:
                    intensity = kde([lat, lon])[0]
                    if intensity > 0.001:
                        heatmap_points.append({
                            'lat': float(lat),
                            'lon': float(lon),
                            'intensity': float(intensity)
                        })
                except Exception:
                    continue
        return heatmap_points
    except Exception:
        return [{'lat': float(row['lat']), 'lon': float(row['lon']), 'intensity': 0.8} for _, row in incidents_df.iterrows()]
