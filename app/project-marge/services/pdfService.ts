import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId: string, appName: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // 1. Landscape prompt
  const confirmLandscape = window.confirm("Wilt u exporteren in liggende (landscape) modus voor betere weergave van grafieken?");
  const orientation = confirmLandscape ? 'l' : 'p';

  // 2. Setup PDF
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Header
  pdf.setFontSize(16);
  pdf.text(appName, margin, margin);
  pdf.setFontSize(10);
  pdf.text(`Export datum: ${new Date().toLocaleDateString('nl-NL')}`, margin, margin + 6);
  
  let currentY = margin + 15;

  // 3. Select cards for smart pagination
  const cards = input.querySelectorAll('.pdf-card');
  if (cards.length === 0) {
    alert("Geen content gevonden om te exporteren.");
    return;
  }

  const pdfCards = Array.from(cards) as HTMLElement[];

  for (const card of pdfCards) {
    // 4. High Quality Render (scale 2)
    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

      // Smart Pagination: Check if image fits on current page
      if (currentY + imgHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
      currentY += imgHeight + 8; // spacing
    } catch (err) {
      console.error("Error rendering PDF card:", err);
    }
  }

  pdf.save(`${appName.replace(/\s+/g, '_')}_Export.pdf`);
};
