import google.generativeai as genai
from ..config import settings
import base64
from io import BytesIO
from PIL import Image

# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    async def analyze_plant_health(self, image_base64: str) -> str:
        """
        Analyze plant leaf image for health issues.
        
        Args:
            image_base64: Base64 encoded image string
            
        Returns:
            Analysis result as text
        """
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            
            prompt = """You are an agricultural expert AI. Analyze this plant leaf image. 
            Detect any signs of disease, nutrient deficiency, or water stress. 
            If it looks healthy, say so. Keep the response concise (max 3 sentences)."""
            
            response = self.model.generate_content([prompt, image])
            return response.text
        
        except Exception as e:
            return f"Error analyzing image: {str(e)}"
    
    async def analyze_security_image(self, image_base64: str) -> str:
        """
        Analyze security camera image for motion detection.
        
        Args:
            image_base64: Base64 encoded image string
            
        Returns:
            Analysis result as text
        """
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            
            prompt = """You are a farm security AI. Identify what caused the motion trigger in this image. 
            Is it a human, an animal, or a false alarm? Be brief."""
            
            response = self.model.generate_content([prompt, image])
            return response.text
        
        except Exception as e:
            return f"Error analyzing security image: {str(e)}"
    
    async def get_farming_advice(self, context: str, question: str) -> str:
        """
        Get farming advice based on context and user question.
        
        Args:
            context: Current farm conditions/context
            question: User's question
            
        Returns:
            AI-generated advice
        """
        try:
            prompt = f"""Context: {context}

User Question: {question}

Answer as a helpful farming assistant:"""
            
            response = self.model.generate_content(prompt)
            return response.text
        
        except Exception as e:
            return f"Error getting advice: {str(e)}"


# Create singleton instance
gemini_service = GeminiService()
