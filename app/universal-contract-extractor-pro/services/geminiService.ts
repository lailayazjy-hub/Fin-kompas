import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContractData } from "../types";

// Define the properties for a single contract/section
const contractProperties = {
  contractType: { type: Type.STRING, description: "Type of contract or section (e.g., NDA, SaaS Agreement, Price Schedule, Hardware List)." },
  summary: { type: Type.STRING, description: "A concise 2-sentence summary of this specific section or table." },
  language: { type: Type.STRING, description: "Language of the document." },
  currency: { type: Type.STRING, description: "ISO Currency code (e.g., EUR, USD)." },
  parties: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        role: { type: Type.STRING, enum: ["Supplier", "Customer", "Other"] },
        address: { type: Type.STRING },
        vatNumber: { type: Type.STRING },
      },
      required: ["name", "role"],
    },
  },
  dates: {
    type: Type.OBJECT,
    properties: {
      startDate: { type: Type.STRING, description: "ISO 8601 Date YYYY-MM-DD" },
      endDate: { type: Type.STRING, description: "ISO 8601 Date YYYY-MM-DD" },
      isAutoRenewal: { type: Type.BOOLEAN },
      noticePeriodDays: { type: Type.NUMBER, description: "Notice period in days." },
    },
    required: ["isAutoRenewal", "noticePeriodDays"],
  },
  financials: {
    type: Type.OBJECT,
    properties: {
      totalValue: { type: Type.NUMBER, description: "Total value for this specific section/table." },
      paymentTerms: { type: Type.STRING, description: "e.g., Net 30, Upon Receipt" },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            periodicity: { type: Type.STRING, enum: ["One-off", "Monthly", "Quarterly", "Yearly"] },
            category: { type: Type.STRING },
          },
          required: ["description", "amount", "periodicity"],
        },
      },
    },
    required: ["totalValue", "items"],
  },
  specifications: {
    type: Type.ARRAY,
    description: "List of technical specifications, BOM, or specific metrics defined in this section.",
    items: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: "e.g., Hardware, Service Level, Material" },
        description: { type: Type.STRING, description: "The specific item or spec name" },
        value: { type: Type.STRING, description: "The value (e.g., '16GB', '99.9%', 'Concrete C30')" },
        unit: { type: Type.STRING, description: "Unit if applicable" }
      },
      required: ["category", "description", "value"]
    }
  },
  calculations: {
    type: Type.ARRAY,
    description: "Breakdown of calculations found in this section.",
    items: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, description: "What is being calculated" },
        formula: { type: Type.STRING, description: "The logic/math found (e.g., '50 hours * 100 EUR')" },
        result: { type: Type.NUMBER, description: "The resulting number" },
        unit: { type: Type.STRING }
      },
      required: ["label", "result"]
    }
  },
  risks: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        clauseReference: { type: Type.STRING },
      },
      required: ["description", "severity"],
    },
  },
  governingLaw: { type: Type.STRING },
  terminationClauseSummary: { type: Type.STRING },
  businessAnalysis: {
    type: Type.OBJECT,
    description: "Qualitative business analysis of the contract context.",
    properties: {
      introduction: { type: Type.STRING, description: "A short introductory story about the context of this contract (max 50 words)." },
      pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of benefits/pros for the customer." },
      cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of disadvantages/cons or potential issues." },
      processes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of business processes supported (e.g. Procurement, IT Ops)." },
      requirements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific business needs or requirements mentioned." },
      frameworks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of frameworks/standards mentioned (e.g. ISO 27001, GDPR, NEN)." },
    },
    required: ["introduction", "pros", "cons"]
  }
};

// Define the schema as an ARRAY of contract objects to support splitting tables
const multiResultSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: contractProperties,
    required: ["contractType", "parties", "dates", "financials", "risks"],
  }
};

export const analyzeContract = async (
  base64Data: string,
  mimeType: string
): Promise<ContractData[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
    }
    const genAI = new GoogleGenAI({ apiKey });

    const modelId = "gemini-2.0-flash"; // Efficient for extraction

    const response = await genAI.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `
              INSTRUCTIE VOOR HET MODEL:
              Je bent een gespecialiseerde Contract Extractor voor Financial Controllers.
              Lees het volledige document. Het doel is om gestructureerde data te extraheren, zowel financieel als strategisch.
              
              BELANGRIJK - AUTOMATISCHE TABEL DETECTIE:
              Als het document uit meerdere duidelijke onderdelen bestaat, MOET je deze opsplitsen in aparte objecten in de lijst.
              
              REGELS VOOR EXTRACTIE:
              1. Identificeer contracttype, partijen, datums, en financials (zoals eerder gedefinieerd).
              2. FINANCIALS: Extracteer alle kosten, fees, en boetes.
              3. SPECIFICATIES: Technische specs naar 'specifications'.
              4. BEREKENINGEN: Sommen naar 'calculations'.
              
              NIEUW - BUSINESS INTELLIGENCE (Vul het 'businessAnalysis' object):
              5. INTRODUCTIE: Schrijf een korte, zakelijke introductie over waar dit contract over gaat (context).
              6. VOORDELEN/NADELEN: Analyseer de tekst. Wat zijn de voordelen voor de klant? Wat zijn nadelen of risico's (anders dan de juridische risico's)?
              7. PROCESSEN: Welke bedrijfsprocessen worden ondersteund (bijv. Inkoop, Logistiek, IT Beheer)?
              8. EISEN: Welke specifieke "Needs & Requirements" worden genoemd?
              9. FRAMEWORKS: Worden er standaarden genoemd zoals ISO, NEN, GDPR, ITIL?

              Vul lege velden met lege strings/lijsten. Fantaseer niets.
              Input kan Nederlands of Engels zijn. Output ALTIJD in het NEDERLANDS.
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: multiResultSchema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as ContractData[];
      // Ensure arrays exist on all items
      data.forEach(d => {
        if (!d.specifications) d.specifications = [];
        if (!d.calculations) d.calculations = [];
        // Ensure businessAnalysis exists if model missed it
        if (!d.businessAnalysis) {
            d.businessAnalysis = {
                introduction: "Geen introductie gegenereerd.",
                pros: [],
                cons: [],
                processes: [],
                requirements: [],
                frameworks: []
            };
        }
      });
      return data;
    } else {
      throw new Error("No data returned from Gemini");
    }
  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw error;
  }
};
