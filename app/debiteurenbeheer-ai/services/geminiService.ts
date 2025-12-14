import { GoogleGenAI } from "@google/genai";
import { AppState, Invoice, Debtor } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY || '' });

export const analyzeFinancials = async (invoices: Invoice[], debtors: Debtor[]): Promise<string> => {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.API_KEY) {
    return "AI API Key ontbreekt. Voer een geldige key in om analyses te zien.";
  }

  try {
    // Prepare a lightweight summary based on the FILTERED data
    const summary = {
      count: invoices.length,
      totalValue: invoices.filter(i => i.isOpen).reduce((acc, curr) => acc + curr.amount, 0),
      overdue: invoices.filter(i => i.isOpen && new Date(i.dueDate) < new Date()).reduce((acc, curr) => acc + curr.amount, 0),
      uniqueDebtors: new Set(invoices.map(i => i.debtorId)).size
    };

    const prompt = `
      Je bent een financiële controller. Analyseer deze data set (gefilterde periode): ${JSON.stringify(summary)}.
      
      Opdracht:
      1. Geef één zakelijke, feitelijke conclusie over deze specifieke periode/selectie.
      2. Maximaal 2 zinnen.
      3. Maximaal 15 woorden totaal.
      4. Geen begroeting. Focus op risico, trend of opvallend totaal.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || "Geen analyse beschikbaar.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Kon AI-analyse niet ophalen.";
  }
};

export const getDebtorAdvice = async (debtorName: string, overdueAmount: number, riskProfile: string): Promise<string> => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.API_KEY) return "Geen API Key.";

    const prompt = `
      Klant: ${debtorName}. 
      Achterstallig: €${overdueAmount}. 
      Risico: ${riskProfile}.
      Geef 1 kort, zakelijk actiepunt (max 5 woorden). Imperatieve stijl. Bijv: "Direct incasso starten".
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        return response.text || "Geen advies.";
    } catch (e) {
        return "Fout bij ophalen advies.";
    }
}

export const suggestCreditLimit = async (
  debtorName: string, 
  avgMonthlyRevenue: number,
  avgDaysOverdue: number,
  latePaymentFreqPct: number,
  maxPastExposure: number,
  riskAppetite: string
): Promise<number> => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.API_KEY) return Math.ceil(maxPastExposure * 1.1); 

    const prompt = `
      Fungeer als credit risk analist. Bereken een specifieke kredietlimiet voor '${debtorName}' op basis van de volgende input:
      
      1. Gemiddelde maandelijkse omzet: €${avgMonthlyRevenue}
      2. Betaalgedrag (gem. dagen te laat na vervaldatum): ${avgDaysOverdue} dagen
      3. Frequentie te late betalingen: ${latePaymentFreqPct}% van de facturen
      4. Hoogste eerdere saldo (Max Exposure): €${maxPastExposure}
      5. Risicobereidheid bedrijf: ${riskAppetite}
      
      Logica:
      - Als risico 'Conservatief' is: limiet dichtbij Max Exposure of 1.5x maand omzet, verlaag bij slecht gedrag.
      - Als risico 'Speculatief' is: ruimte voor groei, tot 3x maand omzet.
      - Weeg frequentie van te laat betalen zwaar mee.
      
      Output:
      Retourneer uitsluitend het getal (integer) van de nieuwe limiet. Geen tekst.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        const text = response.text?.trim();
        const number = parseInt(text || '0', 10);
        return isNaN(number) ? maxPastExposure : number;
    } catch (e) {
        return maxPastExposure;
    }
}
