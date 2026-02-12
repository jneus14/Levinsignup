
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DiscussionSession } from "../types";

/**
 * Generates AI insights based on the current registration state using Gemini 3 Flash
 */
export const getSessionInsights = async (sessions: DiscussionSession[]): Promise<string> => {
  try {
    // Fix: Always initialize GoogleGenAI with a named parameter object
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare a concise representation of the roster for the prompt
    const summaryData = sessions.map(s => ({
      faculty: s.faculty,
      participants: s.participants.length,
      capacity: s.isUnlimited ? 'Unlimited' : s.capacity,
      waitlist: s.waitlist.length,
      demographics: s.participants.map(p => p.classYear)
    }));

    const prompt = `You are an administrative assistant for Stanford Law School's Levin Center. 
    Analyze the following faculty discussion signup data and provide a professional 3-sentence summary.
    Highlight the most popular sessions and any notable trends in student class years (e.g., 1L vs 3L interest).
    
    Data: ${JSON.stringify(summaryData)}`;

    // Fix: Use the correct model name and explicit GenerateContentResponse type
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Fix: Access the .text property directly (not as a method) as per the latest SDK guidelines
    return response.text || "No insights could be generated from the current data.";
  } catch (error) {
    console.error("Gemini Insight Generation Error:", error);
    return "Error generating AI insights. Please ensure your API key is configured correctly.";
  }
};
