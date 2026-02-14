
// Fix: Strictly follow Gemini API guidelines for initialization and imports
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// Fix: Remove .ts extension from local imports to follow standard TypeScript conventions
import { DiscussionSession } from "../types";

/**
 * Generates AI insights based on the current registration state using Gemini 3 Flash
 */
export const getSessionInsights = async (sessions: DiscussionSession[]): Promise<string> => {
  try {
    // Fix: Initialize GoogleGenAI with a named parameter object right before use as recommended
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    // Prepare a concise representation of the roster for the prompt
    const summaryData = sessions.map(s => ({
      faculty: s.faculty,
      participants: s.participants.length,
      capacity: s.isUnlimited ? 'Unlimited' : s.capacity,
      waitlist: s.waitlist.length,
      demographics: s.participants.map(p => p.classYear)
    }));

    // Fix: Using gemini-3-flash-preview for text summarization tasks as per latest guidelines
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following faculty discussion signup data and provide a professional 3-sentence summary.
Highlight the most popular sessions and any notable trends in student class years (e.g., 1L vs 3L interest).

Data: ${JSON.stringify(summaryData)}`,
      config: {
        systemInstruction: "You are an administrative assistant for Stanford Law School's Levin Center.",
      },
    });

    // Fix: Access the .text property directly (not as a method) as per Gemini SDK rules
    return response.text || "No insights could be generated from the current data.";
  } catch (error) {
    console.error("Gemini Insight Generation Error:", error);
    return "Error generating AI insights. Please ensure your API key is configured correctly.";
  }
};
