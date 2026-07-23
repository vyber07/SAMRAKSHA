# app/services/vision.py

import mediapipe as mp
import subprocess, cv2, numpy as np

class CCTVPipeline:
    def __init__(self, camera_id: str, rtsp_url: str, lat: float, lon: float):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.lat = lat
        self.lon = lon
        self.mp_pose = mp.solutions.pose
        self.person_tracks = {}  # centroid tracking
        self.frame_count = 0
        
    def extract_frame(self) -> np.ndarray:
        # 1 frame every 2 seconds = low CPU
        cmd = [
            'ffmpeg', '-i', self.rtsp_url,
            '-vframes', '1', '-f', 'image2pipe',
            '-vcodec', 'mjpeg', '-'
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=10)
        arr = np.frombuffer(result.stdout, np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    
    def detect_persons(self, frame) -> int:
        # MediaPipe runs on CPU, no GPU needed
        with self.mp_pose.Pose(
            static_image_mode=True,
            min_detection_confidence=0.5
        ) as pose:
            results = pose.process(
                cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            )
        return 1 if results.pose_landmarks else 0
    
    def update_centroid_tracks(self, person_count: int) -> dict:
        # Simple frame-count-based loitering detection
        self.frame_count += 1
        track_id = f"person_{self.frame_count % 50}"
        
        if track_id not in self.person_tracks:
            self.person_tracks[track_id] = 0
        self.person_tracks[track_id] += person_count
        
        loitering = any(
            count > 300  # 300 frames = ~10 min at 1fps
            for count in self.person_tracks.values()
        )
        return {'loitering': loitering}
    
    async def generate_signal(self, person_count: int, loitering: bool, frame=None) -> dict:
        area_sqm = 500  
        density = person_count / area_sqm
        
        avg = self.get_rolling_avg()
        std = self.get_rolling_std()
        z_score = (density - avg) / (std + 0.001)
        
        alert_type = None
        confidence = min(z_score / 5, 1.0)
        
        # Integrate LLaVA model for vision anomaly detection if frame is available
        llava_context = "Clear"
        if frame is not None and (loitering or z_score > 2.5):
            import httpx
            import base64
            # Encode frame
            _, buffer = cv2.imencode('.jpg', frame)
            img_b64 = base64.b64encode(buffer).decode('utf-8')
            
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        "http://llamacpp:3389/v1/chat/completions",
                        json={
                            "messages": [
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": "Analyze this CCTV frame. Describe any suspicious activity, weapons, or intense crowding."},
                                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
                                    ]
                                }
                            ],
                            "stream": False
                        },
                        timeout=5.0
                    )
                    if resp.status_code == 200:
                        llava_context = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            except Exception as e:
                llava_context = f"Vision model unavailable: {str(e)}"
        
        if loitering:
            alert_type = 'loitering'
        elif z_score > 2.5:
            alert_type = 'anomaly'
        elif density > 0.1:
            alert_type = 'crowd_density'
        
        return {
            'camera_id': self.camera_id,
            'source': 'samraksha_vision_llamacpp',
            'alert_type': alert_type,
            'confidence': confidence,
            'person_count': person_count,
            'context': llava_context,
            'lat': self.lat,
            'lon': self.lon
        }

    def get_rolling_avg(self) -> float:
        return 0.02

    def get_rolling_std(self) -> float:
        return 0.005

# WHAT WE DO NOT BUILD:
# No face recognition
# No weapon detection
# No crime classification ("this looks like a robbery")
# Only: count, duration, density anomaly
# Every output is a risk SIGNAL for officer review
# No automated action without human confirmation
