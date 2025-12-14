import { GoogleGenAI } from "@google/genai";
import { ProjectRecord } from "../types";

const getClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeFinancialData = async (records: ProjectRecord[]): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key ontbreekt. Voeg een API key toe om AI analyse te gebruiken.";
  }

  // Summarize data for the prompt to save tokens and avoid noise
  const summary = records.map(r => 
    `Project: ${r.projectName}, Omzet=${r.revenue}, Kosten=${r.totalCosts}, Marge=${(r.marginPercent * 100).toFixed(1)}%`
  ).join('\n');

  const prompt = `
    Je bent een senior projectmanager en financieel analist. Analyseer de volgende projectdata.
    Geef beknopt commentaar (max 3 zinnen) op:
    1. Welke projecten het meest winstgevend zijn.
    2. Waar de risico's liggen (lage marges).
    3. Advies voor kostenbeheersing.
    
    Data:
    ${summary}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text || "Geen analyse beschikbaar.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Er is een fout opgetreden bij het ophalen van de analyse.";
  }
};
