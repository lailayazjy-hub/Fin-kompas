
import { GoogleGenAI } from "@google/genai";
import { TransactionEntry, MatchingResult } from "../types";

export const analyzeMatchingResults = async (result: MatchingResult): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return "API Key ontbreekt. Voeg NEXT_PUBLIC_GEMINI_API_KEY toe aan .env.local om live AI-analyse te genereren.";
  }

  // Summarize data for the prompt
  const totalUnmatchedA = result.bankUnmatched.reduce((sum, i) => sum + i.amount, 0);
  const totalUnmatchedB = result.ledgerUnmatched.reduce((sum, i) => sum + i.amount, 0);
  const diff = totalUnmatchedA - totalUnmatchedB;

  const topUnmatchedA = result.bankUnmatched
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(i => `${i.description} (€${i.amount})`)
    .join(", ");

  const topUnmatchedB = result.ledgerUnmatched
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(i => `${i.description} (€${i.amount})`)
    .join(", ");

  const prompt = `
    Je bent een financiële controller die een afletter-rapport analyseert (GBR vs GBR).
    Geef een zeer korte, zakelijke conclusie (max 3 zinnen).
    
    Data:
    - Onverklaard Reeks A: €${totalUnmatchedA} (Top items: ${topUnmatchedA})
    - Onverklaard Reeks B: €${totalUnmatchedB} (Top items: ${topUnmatchedB})
    - Netto verschil: €${diff}
    
    Vraag: Waar lijkt het grootste probleem te zitten? Zijn er ontbrekende facturen of boekingsfouten?
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Je bent een strikte, zakelijke controller. Geef direct antwoord zonder introductie.",
        temperature: 0.2, 
        maxOutputTokens: 100,
      },
    });

    return response.text || "Kon geen analyse genereren.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Fout bij het ophalen van AI-analyse.";
  }
};
