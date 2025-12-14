import { GoogleGenAI } from "@google/genai";
import { VatRecord } from "../types";

const getClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeFinancialData = async (records: VatRecord[]): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key ontbreekt. Voeg een API key toe om AI analyse te gebruiken.";
  }

  // Summarize data for the prompt to save tokens and avoid noise
  const summary = records.map(r => 
    `${r.year} ${r.period}: Omzet=${r.omzet_nl_hoog + r.omzet_nl_laag}, BTW Afdracht=${r.btw_hoog + r.btw_laag + r.btw_overig}, Voorbelasting=${r.voorbelasting}`
  ).join('\n');

  const prompt = `
    Je bent een financiële expert voor Nederlandse belastingen. Analyseer de volgende BTW data samenvatting. 
    Geef beknopt commentaar (max 3 zinnen) op trends, opvallende ratio's tussen omzet en BTW, of grote afwijkingen.
    Gebruik een zakelijke toon.
    
    Data:
    ${summary}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Geen analyse beschikbaar.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Er is een fout opgetreden bij het ophalen van de analyse.";
  }
};