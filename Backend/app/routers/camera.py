from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import base64

from ..database import get_db
from ..models import AnalysisLog

router = APIRouter()

# Videos directory (relative to app folder)
VIDEOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos")


@router.get("/alerts")
async def get_security_alerts(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get security alerts with images from the database.
    Returns the most recent security detections.
    """
    alerts = db.query(AnalysisLog).filter(
        AnalysisLog.analysis_type == "security"
    ).order_by(AnalysisLog.timestamp.desc()).limit(limit).all()
    
    result = []
    for alert in alerts:
        # Convert image bytes to base64 if stored as bytes
        image_data = None
        if alert.image_path:
            if isinstance(alert.image_path, bytes):
                image_data = base64.b64encode(alert.image_path).decode('utf-8')
            else:
                image_data = alert.image_path
        
        result.append({
            "id": str(alert.id),
            "timestamp": alert.timestamp.isoformat(),
            "detectedObject": alert.result,
            "image_data": image_data,
            "video_filename": alert.video_path
        })
    
    return {"alerts": result}


@router.get("/alerts/latest")
async def get_latest_security_alert(db: Session = Depends(get_db)):
    """
    Get the most recent security alert.
    """
    alert = db.query(AnalysisLog).filter(
        AnalysisLog.analysis_type == "security"
    ).order_by(AnalysisLog.timestamp.desc()).first()
    
    if not alert:
        return {"alert": None}
    
    # Convert image bytes to base64 if stored as bytes
    image_data = None
    if alert.image_path:
        if isinstance(alert.image_path, bytes):
            image_data = base64.b64encode(alert.image_path).decode('utf-8')
        else:
            image_data = alert.image_path
    
    return {
        "alert": {
            "id": str(alert.id),
            "timestamp": alert.timestamp.isoformat(),
            "detectedObject": alert.result,
            "image_data": image_data,
            "video_filename": alert.video_path
        }
    }


@router.get("/videos/{filename}")
async def get_video(filename: str):
    """
    Serve a recorded video clip by filename.
    """
    # Sanitize filename to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    filepath = os.path.join(VIDEOS_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Determine media type based on extension
    if filename.endswith('.avi'):
        media_type = "video/x-msvideo"
    elif filename.endswith('.mp4'):
        media_type = "video/mp4"
    elif filename.endswith('.webm'):
        media_type = "video/webm"
    else:
        media_type = "video/mp4"
    
    return FileResponse(
        filepath, 
        media_type=media_type,
        filename=filename
    )


@router.get("/videos")
async def list_videos():
    """
    List all recorded video clips.
    """
    if not os.path.exists(VIDEOS_DIR):
        return {"videos": []}
    
    videos = []
    for filename in os.listdir(VIDEOS_DIR):
        if filename.endswith(".mp4"):
            filepath = os.path.join(VIDEOS_DIR, filename)
            videos.append({
                "filename": filename,
                "size": os.path.getsize(filepath),
                "created": os.path.getctime(filepath)
            })
    
    # Sort by creation time (newest first)
    videos.sort(key=lambda x: x["created"], reverse=True)
    
    return {"videos": videos}
