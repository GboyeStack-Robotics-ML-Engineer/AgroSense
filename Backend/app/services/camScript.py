import cv2
import numpy as np
import time
import threading
import http.server
import socketserver
import os
from collections import deque
from datetime import datetime

from tflite_runtime.interpreter import Interpreter

import asyncio

from ..database import SessionLocal
from ..models import AnalysisLog
from ..routers.websocket import broadcast_alert
import base64
import logging
import subprocess


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)

logger = logging.getLogger("SmartCameraService")

# Directory to store recorded videos
VIDEOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)


class SmartCamera():
        def __init__(self):
                self.cap = cv2.VideoCapture(0)

                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
                
                if not self.cap.isOpened():
                        print("Error: Could not open USB Camera.")

                self.frame = None
                self.lock = threading.Lock()
                self.running = True
                
                # Frame buffer for video recording (stores ~15 seconds of frames)
                self.frame_buffer = deque(maxlen=int(self.fps * 15))
                self.buffer_lock = threading.Lock()

                self.thread = threading.Thread(target = self._update, daemon=True)
                self.thread.start()

        def _update(self):
                while self.running == True:
                        success, frame = self.cap.read()
                        if success:
                                timestamp = time.time()
                                with self.lock:
                                        self.frame = frame
                                # Also store in buffer for video recording
                                with self.buffer_lock:
                                        self.frame_buffer.append((timestamp, frame.copy()))

        def get_frame(self):
                with self.lock:
                        return self.frame.copy() if self.frame is not None else None
        
        def record_video_clip(self, duration_seconds=10):
                """
                Record a video clip from the moment of detection.
                Captures frames from buffer (past) + continues recording for duration_seconds.
                Returns the filename of the saved video.
                """
                try:
                        # Generate unique filename
                        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"alert_{timestamp_str}.mp4"
                        filepath = os.path.join(VIDEOS_DIR, filename)
                        
                        # Get frames from buffer (past ~5 seconds)
                        with self.buffer_lock:
                                past_frames = list(self.frame_buffer)
                        
                        logger.info(f"Recording video: {len(past_frames)} frames in buffer, fps={self.fps}")
                        
                        # Video writer setup - try H264 first, fallback to XVID
                        # H264 is best for browser compatibility
                        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # H.264 codec
                        out = cv2.VideoWriter(filepath, fourcc, self.fps, (640, 480))
                        
                        # If H264 fails, try XVID
                        if not out.isOpened():
                                logger.warning("H264 codec not available, trying XVID...")
                                filename = f"alert_{timestamp_str}.avi"
                                filepath = os.path.join(VIDEOS_DIR, filename)
                                fourcc = cv2.VideoWriter_fourcc(*'XVID')
                                out = cv2.VideoWriter(filepath, fourcc, self.fps, (640, 480))
                        
                        if not out.isOpened():
                                logger.error("Failed to open VideoWriter with any codec")
                                return None
                        
                        # Write past frames from buffer (last 5 seconds)
                        frames_written = 0
                        past_frame_count = min(len(past_frames), int(self.fps * 5))
                        for _, frame in past_frames[-past_frame_count:]:
                                out.write(frame)
                                frames_written += 1
                        
                        logger.info(f"Wrote {frames_written} frames from buffer")
                        
                        # Continue recording for remaining duration (5 more seconds)
                        remaining_seconds = max(5, duration_seconds - 5)
                        remaining_frames = int(self.fps * remaining_seconds)
                        
                        logger.info(f"Recording {remaining_frames} more frames ({remaining_seconds}s)...")
                        
                        for i in range(remaining_frames):
                                frame = self.get_frame()
                                if frame is not None:
                                        out.write(frame)
                                        frames_written += 1
                                time.sleep(1.0 / self.fps)
                        
                        out.release()
                        
                        # Verify the video was created
                        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                                logger.info(f"Video clip saved: {filename} ({frames_written} frames, {os.path.getsize(filepath)} bytes)")
                                return filename
                        else:
                                logger.error(f"Video file not created or empty: {filepath}")
                                return None
                        
                except Exception as e:
                        logger.error(f"Error recording video: {e}")
                        return None
        
        def destroy(self):
                self.running = False
                if self.cap.isOpened():
                        self.cap.release()


        def stream(self):
                while True:
                        frame = self.get_frame()
                        if frame is None:
                                continue
                        ret, buffer = cv2.imencode(".jpg", frame)
                        if not ret:
                                continue
                        frame_bytes = buffer.tobytes()

                        yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        
        async def run_security_loop(self, model_path):
                try:
                    while True:
                        await asyncio.sleep(6)

                        prev = self.get_frame()
                        await asyncio.sleep(2)
                        next_frame = self.get_frame()
                        if (prev is not None) and (next_frame is not None):
                                intruder = await asyncio.to_thread(detect_motion, prev, next_frame, model_path)
                                if intruder is not None:
                                        logger.info("Intruder detected! Recording video clip...")
                                        
                                        # Record video clip (10 seconds)
                                        video_filename = await asyncio.to_thread(self.record_video_clip, 10)
                                        
                                        # Save the detection frame
                                        ret, buffer = cv2.imencode(".jpg", intruder)
                                        if not ret:
                                                continue
                                        frame_bytes = buffer.tobytes()

                                        # Save to database with video filename
                                        alert_payload = await asyncio.to_thread(
                                                save_alert_to_db, 
                                                frame_bytes, 
                                                video_filename
                                        )

                                        # Broadcast to frontend
                                        if alert_payload:
                                                await broadcast_alert(alert_payload)
                                        logger.info("Alert broadcasted to frontend")
                                        asyncio.sleep(60)  # Avoid immediate re-detection

                except Exception as e:
                       logger.error(f"security loop error: {e}")


def detect_motion(prev, next, model_path):
                # print(model_path)
                try:
                        threshold = 0.6
                        prev_gray, next_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY), cv2.cvtColor(next, cv2.COLOR_BGR2GRAY)
                        prev_gray, next_gray = cv2.GaussianBlur(prev_gray, (21, 21), 0), cv2.GaussianBlur(next_gray, (21, 21), 0)

                        frame_delta = cv2.absdiff(prev_gray, next_gray)
                        thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]

                        thresh = cv2.dilate(thresh, None, iterations=2)

                        cnts, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        frame = next
                        for contour in cnts:
                                if cv2.contourArea(contour) > 500:
                                        interpreter = Interpreter(model_path=model_path)
                                        interpreter.allocate_tensors()
                                        input_details = interpreter.get_input_details()
                                        output_details = interpreter.get_output_details()

                        # 2. Resize to 300x300 (Standard for SSD MobileNet)
                                        img_resized = cv2.resize(next, (300, 300))
                                        input_data = np.expand_dims(img_resized, axis=0)

                                        interpreter.set_tensor(input_details[0]['index'], input_data)

                                        interpreter.invoke()

                                # 4. Get Results
                                # Boxes: [ymin, xmin, ymax, xmax]
                                        boxes = interpreter.get_tensor(output_details[0]['index'])[0]
                                # Classes: The ID number (0=Person, 18=Dog, etc.)
                                        classes = interpreter.get_tensor(output_details[1]['index'])[0]
                                # Scores: Confidence (0.0 to 1.0)
                                        scores = interpreter.get_tensor(output_details[2]['index'])[0]

                                        INTRUDER_IDS = [0.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0]

                                        intruder_found = False

                                        for i in range(len(scores)):
                                                if scores[i] > threshold:
                                                        detected_id = classes[i]

                                                # Check if it is an intruder
                                                        if detected_id in INTRUDER_IDS:
                                                                intruder_found = True

                                                                ymin, xmin, ymax, xmax = boxes[i]
                                                                h, w, _ = frame.shape

                                                        # Convert 0-1 range to pixels
                                                                x1 = int(xmin * w)
                                                                x2 = int(xmax * w)
                                                                y1 = int(ymin * h)
                                                                y2 = int(ymax * h)

                                                        # Draw Red Box
                                                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                                                        # Label it (e.g., "Intruder: Person")
                                                                label_map = {0:'Person', 16:'Bird', 17:'Cat', 18:'Dog', 21:'Cow'}                                 
                                                                obj_name = label_map.get(detected_id, 'Animal')

                                                                label_text = f"Intruder: {obj_name}, Conf: {round(scores[i]*100, 1)}%"
                                                                (text_w, text_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                                                                cv2.rectangle(frame, (x1, y1-20), (x1 + text_w, y1), (0,0,255),-1)

                                                                cv2.putText(frame, label_text, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)                                                      
                                                                print(f"⚠️ ALERT: {obj_name} detected with {scores[i]*100:.1f}% confidence!")                               
                                                return frame
                except Exception as e:
                	logger.error(f"Model Error: {str(e)}")


def save_alert_to_db(image_bytes, video_filename=None):
    """Helper to run DB operations synchronously"""
    db = SessionLocal()
    try:
        capture = AnalysisLog(
            analysis_type="security",
            result="Detected",
            image_path=image_bytes,  # Store image bytes
            video_path=video_filename  # Store video filename
        )
        db.add(capture)
        db.commit()
        db.refresh(capture)
        
        base64_img = base64.b64encode(image_bytes).decode('utf-8')
        
        # Structure this exactly how the frontend expects it
        alert_payload = {
            "id": str(capture.id),
            "timestamp": capture.timestamp.isoformat(),
            "detectedObject": capture.result, 
            "image_data": base64_img,  # The raw image data
            "video_filename": video_filename  # Video clip filename
        }
        
        return alert_payload
        
    except Exception as e:
        print(f"DB Error: {e}")
        return None
    finally:
        db.close()
