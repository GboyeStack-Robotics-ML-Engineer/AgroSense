import cv2
import numpy as np
import time
import threading
import http.server
import socketserver
import os

from tflite_runtime.interpreter import Interpreter

import asyncio
from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
import uvicorn

app = FastAPI()


class SmartCamera():
	def __init__(self):
		self.cap = cv2.VideoCapture(0)

		self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
		self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)


		if not self.cap.isOpened():
			print("Error: Could not open USB Camera.")


		self.frame = None
		self.lock = threading.Lock()
		self.running = True

		self.thread = threading.Thread(target = self._update, daemon=True)
		self.thread.start()

	def _update(self):
		while self.running == True:
			success, frame = self.cap.read()
			if success:
				with self.lock:
					self.frame = frame
 
	def get_frame(self):
		with self.lock:
			return self.frame.copy() if self.frame is not None else None
        
	def destroy(self):
		self.running = False
		if self.cap.isOpened():
			self.cap.release()
    

camera = SmartCamera()


def stream(cam=camera):

	while True:
		frame = camera.get_frame()
		ret, buffer = cv2.imencode(".jpg", frame)
		if not ret:
			continue
		frame_bytes = buffer.tobytes()

		yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

def detect_motion(prev, next):
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
				interpreter = Interpreter(model_path="detect.tflite")
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

							label_text = f"Intruder: {obj_name}, Conf: {scores[i]*100:1f}"
							(text_w, text_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)

							cv2.rectangle(frame, (x1, y1-20), (x1 + text_w, y1), (0,0,255), -1)

                    
							cv2.putText(frame, label_text, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
							print(f"⚠️ ALERT: {obj_name} detected with {scores[i]*100:.1f}% confidence!")
				return frame

async def get_intruder():
	while True:
		await asyncio.sleep(3)

		prev = camera.get_frame()
		await asyncio.sleep(2)
		next = camera.get_frame()
	
		if (prev is not None) and (next is not None):
			intruder = await asyncio.to_thread(detect_motion, prev, next)
		
		ret, buffer = cv2.imencode(".jpg", intruder)
		if not ret:
			continue
		frame_bytes = buffer.tobytes()


		yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


@app.get("/video_feed")
async def video_feed():
	return StreamingResponse(stream(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/warning_stream")
async def video_feed():
	return StreamingResponse(get_intruder(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.on_event("shutdown")
async def shutdown_event():
	global camera
	camera.destroy()

if __name__ == "__main__":
	uvicorn.run(app, host="smart.local", port=8000)


