import { GoogleGenAI } from "@google/genai";
import { FinancialRecord, AIInsight, Language } from "../types";

const API_KEY = process.env.API_KEY || ''; 

// Initialize GenAI
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateFinancialInsight = async (
  costType: string, 
  records: FinancialRecord[], 
  lang: Language
): Promise<AIInsight> => {
  
  // Guard clause if no key is present (demo mode fallback)
  if (!API_KEY) {
    return {
      costType,
      insight: lang === Language.NL 
        ? "AI-sleutel ontbreekt. Dit is een gesimuleerd inzicht gebaseerd op de trend."
        : "AI key missing. This is a simulated insight based on the trend."
    };
  }

  // Sort records by date ascending
  const sorted = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Prepare a summarization of the last 6 points for context
  const recentData = sorted.slice(-6).map(r => `${r.date.toISOString().split('T')[0]}: ${r.amount}`).join(', ');

  const promptNL = `
    Analyseer deze financiële kostenreeks voor '${costType}': [${recentData}].
    Geef een zakelijke, feitelijke samenvatting van de trend of anomalie.
    Maximaal 2 zinnen. Maximaal 15 woorden. Geen introductie.
  `;

  const promptEN = `
    Analyze this financial cost series for '${costType}': [${recentData}].
    Provide a professional, factual summary of the trend or anomaly.
    Max 2 sentences. Max 15 words. No introduction.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lang === Language.NL ? promptNL : promptEN,
    });

    const text = response.text || (lang === Language.NL ? "Geen analyse beschikbaar." : "No analysis available.");
    return {
      costType,
      insight: text.trim()
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      costType,
      insight: lang === Language.NL ? "Kan geen AI-analyse genereren." : "Unable to generate AI analysis."
    };
  }
};
