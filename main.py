from fastapi import FastAPI, File, HTTPException, UploadFile
from google import genai
import os
import json
import io
from dotenv import load_dotenv
from PIL import Image
from datetime import datetime
from pydantic import BaseModel

load_dotenv()
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
app = FastAPI()

PROMPT = f"""
    The following is an image of a parking sign. Your purpose is to analyze the image
    and determine if the user can park here.
    - Can I park here?
    - What are the parking rules?
    - Simple Explanation to the user
    - The current time is {datetime.now()}
    """

@app.get("/")
async def root():
    return {"message": f"Hello World the current time is {datetime.now()}"}

class Response(BaseModel):
  can_park: bool
  rules: list[str]
  simple_explanation: str

@app.post("/analyze-mvp")
async def analyze():
  try:
    image = Image.open("parking_sign.jpeg")


    response = await client.aio.models.generate_content(
      model='gemini-2.0-flash',
      contents=[PROMPT, image],
      config={
        'response_mime_type':"application/json",
        'response_schema':Response,
      },
    )
    return response.parsed
  except Exception as e:
    return {"message": str(e)}


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/heic", "image/heif"}
MAX_BYTES = 15 * 1024 * 1024  # 15 MB

@app.post("/analyze")
async def analyze_uploaded_image(image: UploadFile = File(...)):
  try:
    print(image.content_type)
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    file_bytes = await image.read()

    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File size exceeds 15 MB")

    pil_image = Image.open(io.BytesIO(file_bytes))
     
    response = await client.aio.models.generate_content(
      model='gemini-2.0-flash',
      contents=[PROMPT, pil_image],
      config={
        'response_mime_type':"application/json",
        'response_schema':Response,
      },
    )
    return response.parsed
  except Exception as e:
    return {"message": str(e)}