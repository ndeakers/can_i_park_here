from fastapi import UploadFile
from google import genai
import io
from PIL import Image
from datetime import datetime
from pydantic import BaseModel

## types
class ParkingAnalysis(BaseModel):
    is_parking_sign: bool
    can_park: bool
    rules: list[str]
    simple_explanation: str

## errors
class AnalysisError(Exception):
    pass

class UnsupportedMediaTypeError(AnalysisError):
    pass

class FileTooLargeError(AnalysisError):
    pass

class ImageProcessingError(AnalysisError):
    pass

## service
class AnalysisService:
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.gemini_client = genai.Client(api_key=gemini_api_key)
        self.allowed_image_types = [
            "image/jpeg",
            "image/png",
        ]

    def _get_prompt(self) -> str:
        return f"""
        The following is an image of a parking sign. Your purpose is to analyze the image
        and determine if the user can park here.
        Notes: In general, when the sign has exceptions, that means the individual sign is exempt from the rules it states.
        Example: 2 hour parking, except Saturday and Sunday, That means the sign is exempt from the 2 hour parking rule on Saturday and Sunday and parking is free.
        
        - Is this a parking sign?
        - Can I park here?
        - What are the parking rules? List the rules that the sign has.
        - Simple Explanation to the user
        - The current time is {datetime.now()}
        """

    async def _process_image(self, image: UploadFile) -> Image.Image:
        """Process the image and return a PIL image"""
        if image.content_type not in self.allowed_image_types:
            raise UnsupportedMediaTypeError("Unsupported media type")

        file_bytes = await image.read()
        max_bytes = 15 * 1024 * 1024

        if len(file_bytes) > max_bytes:
            raise FileTooLargeError("File size exceeds 15 MB")

        try:
            pil_image = Image.open(io.BytesIO(file_bytes))
            return pil_image
        except Exception as e:
            raise ImageProcessingError("Error processing image") from e

    def _get_response_schema(self) -> type[BaseModel]:
        return ParkingAnalysis

    async def analyze_image(
        self,
        image: UploadFile,
    ) -> ParkingAnalysis:
        """Process and analyze the parking sign image and return a response in JSON format"""
        pil_image = await self._process_image(image)
        prompt = self._get_prompt()
        response_schema = self._get_response_schema()
        response = await self.gemini_client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, pil_image],
            config={
                "response_mime_type": "application/json",
                "response_schema": response_schema,
            },
        )
        return response.parsed
