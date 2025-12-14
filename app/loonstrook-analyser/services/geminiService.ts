import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { LineItem, LineItemType, FileMetadata } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface ParseResult {
  lines: LineItem[];
  metadata: FileMetadata;
}

export const parsePayslip = async (file: File, sourceId: string): Promise<ParseResult> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          lineItems: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                description: { type: SchemaType.STRING },
                amount: { type: SchemaType.NUMBER },
                category: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING, enum: [LineItemType.INCOME, LineItemType.DEDUCTION, LineItemType.INFORMATION, LineItemType.NET_PAYOUT] },
                aiRemark: { type: SchemaType.STRING }
              },
              required: ["description", "amount", "category", "type"]
            }
          },
          metadata: {
            type: SchemaType.OBJECT,
            properties: {
              detectedHoursPerWeek: { type: SchemaType.NUMBER, description: "Aantal contracturen per week, bijv. 32 of 40" },
              period: { type: SchemaType.STRING }
            }
          }
        }
      }
    }
  });

  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Je bent een expert in Nederlandse salarisadministratie.
    Analyseer het geüploade bestand (loonstrook PDF of afbeelding).
    
    TAAK:
    1. Haal alle individuele transactieregels eruit.
    2. Probeer de contracturen per week te vinden (vaak 32, 36, 38 of 40).
    
    BELANGRIJK VOOR REGELS: 
    - Negeer subtotalen en totalen (behalve het uiteindelijke Netto loon). We willen de opbouw zien.
    - Zet bedragen om naar getallen (bijv. "1.200,50" wordt 1200.50).
    - Categoriseer elke regel correct.
    - Bepaal het type: INCOME, DEDUCTION, INFORMATION, NET_PAYOUT.
    - Geef een korte, zakelijke AI-opmerking.
    
    BELANGRIJK VOOR METADATA:
    - Zoek naar "Contracturen", "Uren per week", "Parttime percentage" (reken om naar uren, bijv 80% van 40 = 32).
    - Als je het niet zeker weet, laat detectedHoursPerWeek null.
  `;

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  const rawData = JSON.parse(text || "{}");
  const rawLines = rawData.lineItems || [];
  const rawMeta = rawData.metadata || {};

  // Map to internal structure with IDs
  const lines = rawLines.map((item: any, index: number) => ({
    id: `${sourceId}-${index}-${Date.now()}`,
    description: item.description,
    amount: item.amount,
    currency: 'EUR',
    category: item.category,
    type: item.type as LineItemType,
    aiRemark: item.aiRemark || "",
    comments: [],
    sourceId: sourceId
  }));

  return {
    lines,
    metadata: {
      detectedHoursPerWeek: rawMeta.detectedHoursPerWeek,
      period: rawMeta.period
    }
  };
};
