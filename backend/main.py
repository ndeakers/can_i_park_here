from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
import os
from dotenv import load_dotenv
from datetime import datetime
from services.AnalysisService.index import (
    AnalysisService,
    UnsupportedMediaTypeError,
    FileTooLargeError,
    ImageProcessingError,
)
from functools import lru_cache

load_dotenv()
app = FastAPI()

@lru_cache(maxsize=1)
def get_analysis_service() -> AnalysisService:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    return AnalysisService(api_key)


@app.get("/")
async def root():
    return {"message": f"Hello World the current time is {datetime.now()}"}


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    try:
        return await analysis_service.analyze_image(image)
    except UnsupportedMediaTypeError:
        raise HTTPException(status_code=415, detail="Unsupported media type")
    except FileTooLargeError:
        raise HTTPException(status_code=413, detail="File size exceeds 15 MB")
    except ImageProcessingError:
        raise HTTPException(status_code=422, detail="Error processing image")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
