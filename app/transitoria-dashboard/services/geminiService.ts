import { GoogleGenAI } from "@google/genai";
import { LedgerRecord } from "../types";

const getClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeFinancialData = async (records: LedgerRecord[]): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key ontbreekt. Voeg een API key toe om AI analyse te gebruiken.";
  }

  // Summarize data for the prompt
  // Focus on high risk or pending items first to give better context
  const priorityRecords = records.filter(r => r.anomalyScore > 0.5 || r.status === 'PENDING').slice(0, 35);
  const summary = priorityRecords.map(r => 
    `Datum: ${r.datum} | Omschrijving: "${r.omschrijving}" | Bedrag: €${r.bedrag} | Relatie: ${r.relatie} | Score: ${r.anomalyScore}`
  ).join('\n');

  const prompt = `
    Je bent een strenge financiële controller gespecialiseerd in Transitoria (Overlopende activa en passiva).
    Analyseer de volgende boekingen uit het grootboek en zoek naar fouten in de periodetoerekening.
    
    Data (Prioriteit items):
    ${summary}

    Voer deze specifieke controles uit:
    1. CATEGORIE BEPALING: Bepaal voor opvallende posten of het gaat om:
       - Vooruitbetaalde kosten (Prepaid)
       - Nog te ontvangen facturen (Accrued Revenue)
       - Nog te betalen kosten (Accrued Expenses)
    2. ANOMALIE DETECTIE: Zoek naar onlogische toerekeningen. Bijvoorbeeld:
       - Een jaarfactuur die in één keer in de P&L is genomen ipv op de balans.
       - Een factuur voor "Januari" die pas in "Maart" is geboekt zonder overlopende post.
       - Grote ronde bedragen die contractueel lijken maar niet gespreid zijn.
    3. ADVIES: Geef concreet advies welke boekingen gecorrigeerd moeten worden.

    Geef je antwoord als een beknopt en zakelijk advies (max 5 punten). Gebruik bullet points.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Geen analyse beschikbaar.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Er is een fout opgetreden bij het ophalen van de analyse. Controleer de API key en internetverbinding.";
  }
};
