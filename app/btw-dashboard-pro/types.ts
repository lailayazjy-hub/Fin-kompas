
export interface VatRecord {
  id: string;
  sourceFile: string;
  company: string;
  year: number;
  period: string; // e.g., "Q1", "Jan"
  
  // Rubriek 1: Prestaties binnenland
  omzet_nl_hoog: number; // 1a
  btw_hoog: number;
  omzet_nl_laag: number; // 1b
  btw_laag: number;
  omzet_overig: number; // 1c
  btw_overig: number;
  prive_gebruik: number; // 1d
  btw_prive: number;

  // Rubriek 2: Verlegd
  omzet_verlegd: number; // 2a
  btw_verlegd: number;

  // Rubriek 3: Prestaties naar/in buitenland
  leveringen_buiten_eu: number; // 3a
  leveringen_eu: number; // 3b
  installatie_eu: number; // 3c

  // Rubriek 4: Prestaties vanuit buitenland
  leveringen_uit_buiten_eu: number; // 4a
  btw_uit_buiten_eu: number;
  leveringen_uit_eu: number; // 4b
  btw_uit_eu: number;

  // Rubriek 5: Voorbelasting etc
  voorbelasting: number; // 5b
  
  // Extra
  suppletie: number;
  inklaringskosten: number;
  
  // Computed (helper)
  totaal_af_te_dragen?: number;
}

export type ColumnType = 'text' | 'number' | 'date' | 'accounting' | 'general' | 'percentage';

export interface ColumnDefinition {
  id: keyof ExactRecord; // Maps to the internal key
  label: string; // Display name
  type: ColumnType;
  visible: boolean;
  order: number;
  isCustom?: boolean; // If manually added or standard
  accessor?: (r: ExactRecord) => any; // Optional custom accessor
}

export interface ExactRecord {
  id: string;
  // Core Fields
  code: string;        // Grootboekrekening
  description: string; // Omschrijving
  debit: number;       // Debet
  credit: number;      // Credit
  
  // Enhanced Fields
  journal?: string;    // Dagboek
  ref?: string;        // Boekstuknummer / Referentie
  relation?: string;   // Relatienaam
  relationCode?: string; // Klant: Code / Relatie Code
  company?: string;    // Bedrijfsnaam (Detected)
  invoiceNumber?: string; // Factuurnummer
  invoiceDate?: Date | null; // Factuurdatum
  
  // Sales Analysis Fields
  itemCode?: string;        // Artikel / Artikelcode
  itemDescription?: string; // Artikelomschrijving / Details
  itemGroup?: string;       // Artikelgroep
  quantity?: number;        // Aantal
  salesPerson?: string;     // Verkoper
  country?: string;         // Land
  
  // Discount & Gross Fields
  discountAmount?: number;      // Kortingsbedrag
  discountPercentage?: number;  // Korting (%)
  grossAmount?: number;         // Verkoopwaarde (Bruto = Netto + Korting)
  
  // VAT Specific Fields
  vatBox?: string;         // Aangiftevak
  vatCode?: string;        // Btw-code
  vatPercentage?: number;  // Btw %
  vatBase?: number;        // Btw-grondslag
  vatAmount?: number;      // Btw: Bedrag

  // Meta
  type: 'balance' | 'pnl' | 'unknown'; 
  isTotalLine: boolean;
  year?: number;
  period?: string;
  entryDate?: Date | null; // Datum (Boekdatum)
  sourceFile: string;
  
  // For validation tracking
  validationErrors?: Record<string, string>; // key: colId, value: error message
}

export interface FileData {
  id: string;
  name: string;
  records: VatRecord[];
  exactRecords?: ExactRecord[]; 
  active: boolean;
  fileType: 'financial' | 'sales'; 
  uploadContext: 'financial' | 'sales' | 'purchase';
}

export interface Comment {
  id: string;
  recordId?: string;
  field?: string;
  user: string;
  text: string;
  timestamp: Date;
  isManager: boolean;
}

export enum CurrencyMode {
  FULL = 'FULL',
  THOUSANDS = 'THOUSANDS' // 'k' notation
}

export type ThemeName = 'terra_cotta' | 'forest_green' | 'autumn_leaves' | 'citrus_garden';

export interface ThemeColors {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  accent?: string; 
}

export interface AppSettings {
  currencyMode: CurrencyMode;
  hideSmallAmounts: boolean; // < 50 filter
  smallAmountThreshold: number;
  theme: ThemeName;
  appName: string;
}
