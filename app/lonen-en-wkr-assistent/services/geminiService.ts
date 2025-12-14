import { GoogleGenAI, Type } from "@google/genai";
import { Expense, WKRCategory } from "../types";

// NOTE: process.env.API_KEY is handled by the framework/build tool

export const analyzeExpenses = async (
  expenses: Expense[],
  apiKey: string
): Promise<Expense[]> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return expenses;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Filter only items that need analysis or re-analysis to save tokens/time
    // For this demo, we analyze the top 10 most recent un-analyzed or all if few.
    const itemsToAnalyze = expenses.slice(0, 20); 

    if (itemsToAnalyze.length === 0) return expenses;

    const prompt = `
      Je bent een Nederlandse WKR-expert (Werkkostenregeling).
      Beoordeel de volgende uitgavenlijst. 
      Categoriseer elk item in een van de volgende categorieën: 
      'Vrije ruimte', 'Gerichte vrijstelling', 'Nihilwaardering', 'Intermediaire kosten'.
      
      Geef per item een korte, zakelijke toelichting van maximaal 15 woorden.
      Markeer 'isHighRisk' als true als het een twijfelgeval is of vaak fout gaat (zoals maaltijden, dure geschenken).

      Input data:
      ${JSON.stringify(itemsToAnalyze.map(e => ({ id: e.id, description: e.description, amount: e.amount })))}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Vrije ruimte', 'Gerichte vrijstelling', 'Nihilwaardering', 'Intermediaire kosten'] },
              aiComment: { type: Type.STRING },
              isHighRisk: { type: Type.BOOLEAN }
            }
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");

    // Merge results back into expenses
    const updatedExpenses = expenses.map(exp => {
      const analysis = results.find((r: any) => r.id === exp.id);
      if (analysis) {
        return {
          ...exp,
          category: analysis.category as WKRCategory,
          aiComment: analysis.aiComment,
          isHighRisk: analysis.isHighRisk
        };
      }
      return exp;
    });

    return updatedExpenses;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return expenses; // Return original on failure
  }
};
