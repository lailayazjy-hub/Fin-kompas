import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, PageBreak, AlignmentType } from "docx";
import { SourceDocument, AnalysisSettings, Theme } from "../types";

// Helper to sanitize filenames/sheetnames
const sanitize = (str: string) => str.replace(/[\\/?*[\]]/g, "").substring(0, 30);

export const generateExcel = (sources: SourceDocument[]) => {
  const wb = utils.book_new();

  // 1. Management Summary Sheet
  const summaryData = sources.map(s => ({
    "Bestand": s.name,
    "Type": s.data.contractType,
    "Samenvatting": s.data.summary,
    "Startdatum": s.data.dates.startDate || 'N.v.t.',
    "Einddatum": s.data.dates.endDate || 'N.v.t.',
    "Totaal Waarde": s.data.financials.totalValue,
    "Valuta": s.data.currency,
    "Aantal Risico's": s.data.risks.length,
    "Recht": s.data.governingLaw || 'N.v.t.',
    "Auto-Verlenging": s.data.dates.isAutoRenewal ? 'Ja' : 'Nee'
  }));
  const wsSummary = utils.json_to_sheet(summaryData);
  
  // Auto-width for summary columns
  const wscols = Object.keys(summaryData[0] || {}).map(k => ({ wch: 20 }));
  wsSummary['!cols'] = wscols;

  utils.book_append_sheet(wb, wsSummary, "Samenvatting");

  // 2. Individual Sheets for each Source
  sources.forEach((source, idx) => {
    const rows: any[] = [];
    
    // Header Info Block
    rows.push(["BRONBESTAND", source.name]);
    rows.push(["TYPE", source.data.contractType]);
    rows.push(["SAMENVATTING", source.data.summary]);
    rows.push([]); 

    // BUSINESS INTELLIGENCE SECTION
    rows.push(["BEDRIJFSANALYSE & BEHEER"]);
    rows.push(["Startdatum", source.data.dates.startDate || '-']);
    rows.push(["Einddatum", source.data.dates.endDate || 'Onbepaald']);
    rows.push(["Automatische Verlenging", source.data.dates.isAutoRenewal ? "Ja" : "Nee"]);
    rows.push(["Opzegtermijn", `${source.data.dates.noticePeriodDays} dagen`]);
    rows.push(["Toepasselijk Recht", source.data.governingLaw]);
    rows.push(["Beëindigingsclausule", source.data.terminationClauseSummary]);
    rows.push(["Taal", source.data.language]);
    rows.push([]);

    // Qualitative Analysis (New)
    if(source.data.businessAnalysis) {
        rows.push(["STRATEGISCHE ANALYSE"]);
        rows.push(["Introductie", source.data.businessAnalysis.introduction]);
        rows.push(["Voordelen", (source.data.businessAnalysis.pros || []).join("; ")]);
        rows.push(["Nadelen", (source.data.businessAnalysis.cons || []).join("; ")]);
        rows.push(["Processen", (source.data.businessAnalysis.processes || []).join("; ")]);
        rows.push(["Frameworks", (source.data.businessAnalysis.frameworks || []).join("; ")]);
        rows.push(["Eisen", (source.data.businessAnalysis.requirements || []).join("; ")]);
        rows.push([]);
    }

    // Parties
    rows.push(["BETROKKEN PARTIJEN"]);
    rows.push(["Naam", "Rol", "Adres", "BTW Nummer"]);
    source.data.parties.forEach(p => {
        rows.push([
            p.name, 
            p.role === 'Supplier' ? 'Leverancier' : p.role === 'Customer' ? 'Klant' : 'Overig',
            p.address || '-',
            p.vatNumber || '-'
        ]);
    });
    rows.push([]);

    // Specifications / Operations
    if(source.data.specifications && source.data.specifications.length > 0) {
      rows.push(["OPERATIONELE SPECIFICATIES (ASSETS / SLA)"]);
      rows.push(["Categorie", "Item", "Waarde", "Eenheid"]);
      source.data.specifications.forEach(s => rows.push([s.category, s.description, s.value, s.unit || '']));
      rows.push([]);
    }

    // Financials Table
    rows.push(["FINANCIËLE ANALYSE"]);
    rows.push(["Omschrijving", "Bedrag", "Frequentie", "Categorie", "Status"]);
    source.data.financials.items.forEach(item => {
      rows.push([
        item.description, 
        item.amount, 
        item.periodicity === 'One-off' ? 'Eenmalig' : item.periodicity === 'Monthly' ? 'Maandelijks' : item.periodicity === 'Yearly' ? 'Jaarlijks' : item.periodicity, 
        item.category, 
        item.validationStatus === 'Valid' ? 'Gevalideerd' : item.validationStatus === 'Review' ? 'Controleer' : 'Ongeldig'
      ]);
    });
    rows.push(["TOTAAL CONTRACTWAARDE", source.data.financials.totalValue]);
    rows.push([]); 

    // Calculations Table (if exists)
    if(source.data.calculations && source.data.calculations.length > 0) {
      rows.push(["GEDETECTEERDE BEREKENINGEN"]);
      rows.push(["Omschrijving", "Formule", "Resultaat", "Eenheid"]);
      source.data.calculations.forEach(c => rows.push([c.label, c.formula, c.result, c.unit || '']));
      rows.push([]);
    }

    // Risks Table (if exists)
    if(source.data.risks && source.data.risks.length > 0) {
      rows.push(["RISICO ANALYSE"]);
      rows.push(["Omschrijving", "Niveau", "Referentie"]);
      source.data.risks.forEach(r => rows.push([r.description, r.severity === 'High' ? 'Hoog' : r.severity === 'Medium' ? 'Medium' : 'Laag', r.clauseReference || '']));
    }

    const ws = utils.aoa_to_sheet(rows);
    
    // Set column widths for readability
    ws['!cols'] = [
        { wch: 40 }, // A: Description
        { wch: 40 }, // B: Amount / Info / Intro (Wider)
        { wch: 15 }, // C: Periodicity
        { wch: 20 }, // D: Category
        { wch: 15 }  // E: Status
    ];

    let sheetName = `${idx+1}. ${source.name}`;
    utils.book_append_sheet(wb, ws, sanitize(sheetName));
  });

  writeFile(wb, "Contract_Analyse_Rapport.xlsx");
};

export const generatePDF = (sources: SourceDocument[], settings: AnalysisSettings, theme: Theme) => {
  const doc = new jsPDF();
  const primaryColorHex = theme.colors.primary; 
  
  // Helper to convert hex to rgb for jspdf (default fallback black)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0,0,0];
  }
  const [r,g,b] = hexToRgb(primaryColorHex);

  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(r, g, b);
  doc.text(settings.appName || "Contract Analyse Rapport", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')} ${new Date().toLocaleTimeString('nl-NL')}`, 14, 28);
  doc.text(`Aantal Documenten: ${sources.length} | Totaal Waarde: € ${sources.reduce((sum, s) => sum + s.data.financials.totalValue, 0).toLocaleString('nl-NL')}`, 14, 33);
  
  // Draw divider line
  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);

  let yPos = 45;

  // --- SOURCE LOOP ---
  sources.forEach((source, idx) => {
    // Check if we need a new page for the header
    if (yPos > 250) { doc.addPage(); yPos = 20; }

    // Source Title
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${source.name}`, 14, yPos);
    yPos += 6;
    
    // Meta info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Type: ${source.data.contractType} | Valuta: ${source.data.currency}`, 14, yPos);
    yPos += 8;

    // Summary Box
    doc.setFontSize(9);
    doc.setTextColor(60);
    const splitSummary = doc.splitTextToSize(source.data.summary, 180);
    doc.text(splitSummary, 14, yPos);
    yPos += (splitSummary.length * 5) + 5;

    // --- BUSINESS INTELLIGENCE SECTION ---
    doc.setFontSize(11);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.text("Bedrijfsanalyse & Beheer", 14, yPos);
    yPos += 6;

    // Qualitative Data (Intro)
    if(source.data.businessAnalysis) {
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFont("helvetica", "italic");
        const intro = doc.splitTextToSize(source.data.businessAnalysis.introduction, 180);
        doc.text(intro, 14, yPos);
        yPos += (intro.length * 5) + 5;
        doc.setFont("helvetica", "normal");
    }

    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(`Startdatum: ${source.data.dates.startDate || '-'}`, 14, yPos);
    doc.text(`Einddatum: ${source.data.dates.endDate || 'Onbepaald'}`, 80, yPos);
    yPos += 5;
    doc.text(`Auto-verlenging: ${source.data.dates.isAutoRenewal ? 'Ja' : 'Nee'}`, 14, yPos);
    doc.text(`Opzegtermijn: ${source.data.dates.noticePeriodDays} dagen`, 80, yPos);
    yPos += 5;
    doc.text(`Recht: ${source.data.governingLaw || 'N.v.t.'}`, 14, yPos);
    yPos += 8;

    // Specifications Table (BI)
    if (source.data.specifications && source.data.specifications.length > 0) {
        // @ts-ignore
        autoTable(doc, {
            startY: yPos,
            head: [['Categorie', 'Item', 'Waarde']],
            body: source.data.specifications.map(s => [s.category, s.description, s.value + (s.unit ? ' ' + s.unit : '')]),
            headStyles: { fillColor: [100, 100, 100] }, // Neutral Gray for Specs
            styles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
            theme: 'grid'
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 10;
    }

    // --- FINANCIALS SECTION ---
    doc.setFontSize(11);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.text("Financiële Analyse", 14, yPos);
    yPos += 6;

    // 1. Financials Table
    const financialRows = source.data.financials.items.map(item => [
      item.description,
      item.periodicity === 'One-off' ? 'Eenmalig' : item.periodicity === 'Monthly' ? 'Mnd' : 'Jaar',
      item.amount.toLocaleString('nl-NL', { style: 'currency', currency: source.data.currency })
    ]);

    // @ts-ignore
    autoTable(doc, {
      startY: yPos,
      head: [['Omschrijving', 'Freq', 'Bedrag']],
      body: financialRows,
      headStyles: { fillColor: [r, g, b] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      theme: 'grid'
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10;
    
    // 2. Risks (Highlighted)
    if (source.data.risks.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(11);
        doc.setTextColor(r, g, b); // Theme Color
        doc.setFont("helvetica", "bold");
        doc.text("Risico Analyse", 14, yPos);
        yPos += 5;
        
        const riskRows = source.data.risks.map(risk => [
            risk.severity === 'High' ? 'HOOG' : risk.severity === 'Medium' ? 'Medium' : 'Laag',
            risk.description
        ]);

        // @ts-ignore
        autoTable(doc, {
            startY: yPos,
            head: [['Niveau', 'Risico']],
            body: riskRows,
            headStyles: { fillColor: [220, 53, 69] }, // Standard Red for Risks
            styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold' } },
            margin: { left: 14, right: 14 },
            theme: 'striped'
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        yPos += 10;
    }

    // Divider between sources
    if (idx < sources.length - 1) {
        doc.setDrawColor(230);
        doc.line(14, yPos - 5, 196, yPos - 5);
        yPos += 5;
    }
  });

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
     doc.setFontSize(8);
     doc.setTextColor(150);
     doc.text(`Pagina ${i} van ${pageCount} - ${settings.appName}`, 196, 290, { align: 'right' });
  }

  doc.save("Contract_Analyse_Rapport.pdf");
};

export const generateWord = async (sources: SourceDocument[], settings: AnalysisSettings, theme: Theme) => {
    // Theme color to Hex string (no #)
    const primaryColor = theme.colors.primary.replace('#', '');
    const riskHigh = theme.colors.highRisk.replace('#', '');
    
    // --- 1. CONSOLIDATED SUMMARY SECTION ---
    const consolidatedRows = sources.map(s => {
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(s.name)] }),
                new TableCell({ children: [new Paragraph(s.data.contractType)] }),
                new TableCell({ children: [new Paragraph(s.data.dates.startDate || '-')] }),
                new TableCell({ children: [new Paragraph(s.data.financials.totalValue.toLocaleString('nl-NL', { style: 'currency', currency: s.data.currency }))] }),
            ]
        });
    });

    const summaryTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Bestand", bold: true, color: "FFFFFF" })], shading: { fill: primaryColor } }),
                    new TableCell({ children: [new Paragraph({ text: "Type", bold: true, color: "FFFFFF" })], shading: { fill: primaryColor } }),
                    new TableCell({ children: [new Paragraph({ text: "Startdatum", bold: true, color: "FFFFFF" })], shading: { fill: primaryColor } }),
                    new TableCell({ children: [new Paragraph({ text: "Waarde", bold: true, color: "FFFFFF" })], shading: { fill: primaryColor } }),
                ]
            }),
            ...consolidatedRows
        ]
    });

    const totalValue = sources.reduce((acc, s) => acc + s.data.financials.totalValue, 0);

    // --- 2. CONSOLIDATED RISKS ---
    const allRisks = sources.flatMap(s => s.data.risks.map(r => ({ ...r, sourceName: s.name })));
    
    const riskTableRows = allRisks.map(r => {
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: r.severity === 'High' ? "HOOG" : r.severity === 'Medium' ? "Medium" : "Laag", bold: true, color: r.severity === 'High' ? "D32F2F" : "000000" })] }),
                new TableCell({ children: [new Paragraph(r.sourceName)] }),
                new TableCell({ children: [new Paragraph(r.description)] }),
            ]
        });
    });

    const riskTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Niveau", bold: true })], shading: { fill: "EEEEEE" } }),
                    new TableCell({ children: [new Paragraph({ text: "Bron", bold: true })], shading: { fill: "EEEEEE" } }),
                    new TableCell({ children: [new Paragraph({ text: "Risico Omschrijving", bold: true })], shading: { fill: "EEEEEE" } }),
                ]
            }),
            ...riskTableRows
        ]
    });


    // --- 3. INDIVIDUAL FILE SECTIONS ---
    const fileSections = sources.map(s => {
        const sections = [];
        
        // Page Break before each new file (except the first one maybe, but logic is simpler this way)
        sections.push(new Paragraph({ children: [new PageBreak()] }));
        
        // Header
        sections.push(new Paragraph({ text: s.name, heading: HeadingLevel.HEADING_1, color: primaryColor }));
        sections.push(new Paragraph({ text: `Type: ${s.data.contractType} | Valuta: ${s.data.currency}`, spacing: { after: 200 } }));
        sections.push(new Paragraph({ text: s.data.summary, spacing: { after: 400 }, style: "Italic" }));

        // === BUSINESS INTELLIGENCE SECTION ===
        sections.push(new Paragraph({ text: "Bedrijfsanalyse & Beheer", heading: HeadingLevel.HEADING_2, color: primaryColor }));
        
        // Strategic Context (New)
        if (s.data.businessAnalysis) {
             sections.push(new Paragraph({ text: "Strategische Context", bold: true, spacing: { before: 100, after: 100 } }));
             sections.push(new Paragraph({ text: s.data.businessAnalysis.introduction, spacing: { after: 200 }, style: "Italic" }));
             
             if (s.data.businessAnalysis.pros && s.data.businessAnalysis.pros.length > 0) {
                 sections.push(new Paragraph({ text: "Voordelen:", bold: true }));
                 s.data.businessAnalysis.pros.forEach(p => sections.push(new Paragraph({ text: `• ${p}`, indent: { left: 360 } })));
             }
             
             if (s.data.businessAnalysis.cons && s.data.businessAnalysis.cons.length > 0) {
                 sections.push(new Paragraph({ text: "Nadelen/Risico's:", bold: true, spacing: { before: 100 } }));
                 s.data.businessAnalysis.cons.forEach(c => sections.push(new Paragraph({ text: `• ${c}`, indent: { left: 360 } })));
             }

             if (s.data.businessAnalysis.frameworks && s.data.businessAnalysis.frameworks.length > 0) {
                 sections.push(new Paragraph({ text: "Frameworks:", bold: true, spacing: { before: 100 } }));
                 sections.push(new Paragraph({ text: s.data.businessAnalysis.frameworks.join(", "), indent: { left: 360 } }));
             }

             sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        }

        // Governance Table
        sections.push(new Paragraph({ text: "Governance & Tijdslijnen", bold: true, spacing: { before: 100, after: 100 } }));
        sections.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({text: "Startdatum", bold: true})], shading: {fill: "F3F4F6"} }), 
                    new TableCell({ children: [new Paragraph(s.data.dates.startDate || '-')] }),
                    new TableCell({ children: [new Paragraph({text: "Auto-Verlenging", bold: true})], shading: {fill: "F3F4F6"} }), 
                    new TableCell({ children: [new Paragraph(s.data.dates.isAutoRenewal ? "Ja" : "Nee")] }),
                ]}),
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({text: "Einddatum", bold: true})], shading: {fill: "F3F4F6"} }), 
                    new TableCell({ children: [new Paragraph(s.data.dates.endDate || 'Onbepaald')] }),
                    new TableCell({ children: [new Paragraph({text: "Opzegtermijn", bold: true})], shading: {fill: "F3F4F6"} }), 
                    new TableCell({ children: [new Paragraph(`${s.data.dates.noticePeriodDays} dagen`)] }),
                ]}),
                 new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({text: "Toepasselijk Recht", bold: true})], shading: {fill: "F3F4F6"} }), 
                    new TableCell({ children: [new Paragraph(s.data.governingLaw || '-')], columnSpan: 3 }),
                ]}),
            ]
        }));
        
        // Parties Table
        if (s.data.parties.length > 0) {
             sections.push(new Paragraph({ text: "Betrokken Partijen", bold: true, spacing: { before: 200, after: 100 } }));
             const partyRows = s.data.parties.map(p => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(p.name)] }),
                    new TableCell({ children: [new Paragraph(p.role === 'Supplier' ? 'Leverancier' : p.role === 'Customer' ? 'Klant' : 'Overig')] }),
                    new TableCell({ children: [new Paragraph(p.vatNumber || '-')] }),
                ]
            }));
            sections.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({text: "Naam", bold: true})], shading: {fill: "F3F4F6"} }), new TableCell({ children: [new Paragraph({text: "Rol", bold: true})], shading: {fill: "F3F4F6"} }), new TableCell({ children: [new Paragraph({text: "BTW/ID", bold: true})], shading: {fill: "F3F4F6"} })] }),
                    ...partyRows
                ]
            }));
        }

        // Operational Specs
         if (s.data.specifications && s.data.specifications.length > 0) {
            sections.push(new Paragraph({ text: "Operationele Specificaties (Assets)", bold: true, spacing: { before: 200, after: 100 } }));
            const specRows = s.data.specifications.map(spec => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(spec.category)] }),
                    new TableCell({ children: [new Paragraph(spec.description)] }),
                    new TableCell({ children: [new Paragraph(spec.value + (spec.unit ? ' ' + spec.unit : ''))] }),
                ]
            }));
            sections.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({text: "Categorie", bold: true})], shading: {fill: "F3F4F6"} }), new TableCell({ children: [new Paragraph({text: "Item", bold: true})], shading: {fill: "F3F4F6"} }), new TableCell({ children: [new Paragraph({text: "Waarde", bold: true})], shading: {fill: "F3F4F6"} })] }),
                    ...specRows
                ]
            }));
        }
        sections.push(new Paragraph({ text: "", spacing: { after: 300 } }));


        // === FINANCIALS SECTION ===
        sections.push(new Paragraph({ text: "Financiële Analyse", heading: HeadingLevel.HEADING_2, color: primaryColor }));
        
        const finRows = s.data.financials.items.map(i => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(i.description)] }),
                new TableCell({ children: [new Paragraph(i.category)] }),
                new TableCell({ children: [new Paragraph(i.periodicity === 'One-off' ? 'Eenmalig' : i.periodicity === 'Monthly' ? 'Mnd' : i.periodicity === 'Yearly' ? 'Jaar' : i.periodicity)] }),
                new TableCell({ children: [new Paragraph(i.amount.toLocaleString('nl-NL'))], width: { size: 20, type: WidthType.PERCENTAGE } }),
            ]
        }));

        sections.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "Omschrijving", bold: true })], shading: { fill: "F3F4F6" } }),
                        new TableCell({ children: [new Paragraph({ text: "Categorie", bold: true })], shading: { fill: "F3F4F6" } }),
                        new TableCell({ children: [new Paragraph({ text: "Freq", bold: true })], shading: { fill: "F3F4F6" } }),
                        new TableCell({ children: [new Paragraph({ text: "Bedrag", bold: true })], shading: { fill: "F3F4F6" } }),
                    ]
                }),
                ...finRows
            ]
        }));
        sections.push(new Paragraph({ text: `Totaal: ${s.data.financials.totalValue.toLocaleString('nl-NL')}`, alignment: AlignmentType.RIGHT, bold: true, spacing: { before: 200, after: 400 } }));


        // Calculations (Optional)
        if (s.data.calculations && s.data.calculations.length > 0) {
            sections.push(new Paragraph({ text: "Gedetecteerde Berekeningen", bold: true, color: primaryColor, spacing: { before: 200 } }));
            const calcRows = s.data.calculations.map(c => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(c.label)] }),
                    new TableCell({ children: [new Paragraph(c.formula || '-')] }),
                    new TableCell({ children: [new Paragraph(c.result.toLocaleString('nl-NL') + (c.unit ? ' ' + c.unit : ''))] }),
                ]
            }));
            sections.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({text: "Omschrijving", bold: true})], shading: {fill: "F3F4F6"} }), new TableCell({ children: [new Paragraph({text: "Formule", bold: true})], shading: {fill: "F3F4F6"} }), new TableCell({ children: [new Paragraph({text: "Resultaat", bold: true})], shading: {fill: "F3F4F6"} })] }),
                    ...calcRows
                ]
            }));
        }

        return sections;
    }).flat();


    // --- BUILD DOCUMENT ---
    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 32, bold: true, color: primaryColor },
                    paragraph: { spacing: { before: 240, after: 120 } },
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 26, bold: true, color: primaryColor },
                    paragraph: { spacing: { before: 240, after: 120 } },
                }
            ]
        },
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: settings.appName || "Contract Analyse Rapport",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    text: `Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                
                new Paragraph({ text: "Management Samenvatting", heading: HeadingLevel.HEADING_1 }),
                summaryTable,
                new Paragraph({ text: `Totaal Geconsolideerde Waarde: ${totalValue.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })}`, bold: true, spacing: { before: 200, after: 400 } }),

                new Paragraph({ text: "Geconsolideerd Risicoprofiel", heading: HeadingLevel.HEADING_1 }),
                riskTable,

                ...fileSections
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    
    // Trigger Download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = url;
    a.download = "Contract_Analyse_Rapport.docx";
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};