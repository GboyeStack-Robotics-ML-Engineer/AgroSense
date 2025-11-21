import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePlantHealth = async (base64Image: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key missing. Cannot analyze.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "You are an agricultural expert AI. Analyze this plant leaf image. Detect any signs of disease, nutrient deficiency, or water stress. If it looks healthy, say so. Keep the response concise (max 3 sentences)."
          }
        ]
      }
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Error analyzing image. Please try again.";
  }
};

export const analyzeSecurityImage = async (base64Image: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "You are a farm security AI. Identify what caused the motion trigger in this image. Is it a human, an animal, or a false alarm? Be brief."
          }
        ]
      }
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Error analyzing security image.";
  }
};

export const getFarmingAdvice = async (context: string, question: string): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API Key missing.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: ${context}\n\nUser Question: ${question}\n\nAnswer as a helpful farming assistant:`
      });
      return response.text || "I couldn't process that request.";
    } catch (error) {
      console.error("Gemini chat error:", error);
      return "Error connecting to AI advisor.";
    }
  };
