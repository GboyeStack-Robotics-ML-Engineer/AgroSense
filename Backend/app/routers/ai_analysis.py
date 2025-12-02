from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import AnalysisLog
from ..schemas import AnalysisRequest, AnalysisResponse
from ..services import gemini_service

router = APIRouter()


@router.post("/analyze-plant", response_model=AnalysisResponse)
async def analyze_plant_health(
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze plant leaf image using Gemini AI.
    Expects base64 encoded image.
    """
    if request.analysis_type != "plant_health":
        raise HTTPException(status_code=400, detail="Invalid analysis type for this endpoint")
    
    try:
        # Perform AI analysis
        result = await gemini_service.analyze_plant_health(request.image_base64)
        
        # Log the analysis
        log = AnalysisLog(
            analysis_type="plant_health",
            result=result
        )
        db.add(log)
        db.commit()
        
        return AnalysisResponse(
            analysis_type="plant_health",
            result=result,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-security", response_model=AnalysisResponse)
async def analyze_security_image(
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze security camera image using Gemini AI.
    Expects base64 encoded image.
    """
    if request.analysis_type != "security":
        raise HTTPException(status_code=400, detail="Invalid analysis type for this endpoint")
    
    try:
        # Perform AI analysis
        result = await gemini_service.analyze_security_image(request.image_base64)
        
        # Log the analysis
        log = AnalysisLog(
            analysis_type="security",
            result=result
        )
        db.add(log)
        db.commit()
        
        return AnalysisResponse(
            analysis_type="security",
            result=result,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/farming-advice")
async def get_farming_advice(
    context: str,
    question: str
):
    """
    Get AI-powered farming advice based on context and question.
    """
    try:
        advice = await gemini_service.get_farming_advice(context, question)
        return {
            "question": question,
            "advice": advice,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get advice: {str(e)}")


@router.get("/analysis-history")
async def get_analysis_history(
    analysis_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get history of AI analyses."""
    query = db.query(AnalysisLog)
    
    if analysis_type:
        query = query.filter(AnalysisLog.analysis_type == analysis_type)
    
    logs = query.order_by(AnalysisLog.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "analysis_type": log.analysis_type,
            "result": log.result,
            "timestamp": log.timestamp
        }
        for log in logs
    ]
