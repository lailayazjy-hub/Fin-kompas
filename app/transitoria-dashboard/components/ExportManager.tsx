import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Loader2, FileText, Check, LayoutTemplate, Smartphone } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { utils, write } from 'xlsx';

const ExportManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  // Hook to attach functionality to the read-only App.tsx button
  useEffect(() => {
    const attachListener = () => {
      const buttons = Array.from(document.getElementsByTagName('button'));
      const pdfBtn = buttons.find(b => b.textContent?.includes('Export PDF'));
      
      if (pdfBtn) {
        // We override the click to show our options
        pdfBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPdfOptions(true);
        };
      }
    };

    // Run periodically to ensure we catch re-renders
    const intervalId = setInterval(attachListener, 1000);
    attachListener();

    return () => clearInterval(intervalId);
  }, []);

  const handleExcelExport = () => {
    try {
      setIsExporting(true);
      setStatusText('Tabellen zoeken...');

      const mainElement = document.querySelector('main');
      if (!mainElement) throw new Error('Geen data gevonden');

      // Select visible tables
      const tables = Array.from(mainElement.querySelectorAll('table'));
      
      if (tables.length === 0) {
        alert("Geen tabellen gevonden om te exporteren in de huidige weergave.");
        setIsExporting(false);
        return;
      }

      const wb = utils.book_new();

      tables.forEach((table, index) => {
        // Try to find a title for the sheet
        let sheetName = `Data ${index + 1}`;
        const parentCard = table.closest('.bg-white');
        if (parentCard) {
          const title = parentCard.querySelector('h2, h3')?.textContent;
          if (title) sheetName = title.substring(0, 30).replace(/[:\/\\?*\[\]]/g, '');
        }

        const ws = utils.table_to_sheet(table);
        utils.book_append_sheet(wb, ws, sheetName);
      });

      setStatusText('Excel genereren...');
      
      const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Transitoria_Export_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (e) {
      console.error(e);
      alert('Excel export mislukt: ' + (e as Error).message);
    } finally {
      setIsExporting(false);
      setStatusText('');
    }
  };

  const handlePdfExport = async (orientation: 'landscape' | 'portrait') => {
    setShowPdfOptions(false);
    try {
      setIsExporting(true);
      setStatusText('PDF Voorbereiden...');

      const mainElement = document.querySelector('main') as HTMLElement;
      if (!mainElement) throw new Error('Main content not found');

      // PDF Configuration
      const isLandscape = orientation === 'landscape';
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Transitoria Dashboard Rapportage", margin, margin + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')} | Gegenereerd door Transitoria Dashboard`, margin, margin + 14);

      let currentY = margin + 20;

      // Smart Component Selection
      // We look for "cards" (usually bg-white rounded-lg) to snapshot individually
      // If no cards found, we fallback to snapshotting direct children
      let elementsToSnapshot = Array.from(mainElement.querySelectorAll('.bg-white.rounded-lg, header'));
      
      // Filter out hidden elements or modals
      elementsToSnapshot = elementsToSnapshot.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && !el.closest('.fixed');
      });

      if (elementsToSnapshot.length === 0) {
        // Fallback to children of main
        elementsToSnapshot = Array.from(mainElement.children) as HTMLElement[];
      }

      setStatusText(`Pagina's renderen (0/${elementsToSnapshot.length})...`);

      for (let i = 0; i < elementsToSnapshot.length; i++) {
        const node = elementsToSnapshot[i] as HTMLElement;
        setStatusText(`Pagina's renderen (${i + 1}/${elementsToSnapshot.length})...`);

        // Use html-to-image instead of html2canvas to support modern CSS (like lab/oklch colors)
        const imgData = await toPng(node, {
          backgroundColor: '#ffffff',
          pixelRatio: 3, // High quality
        });

        const imgWidth = contentWidth;
        // Calculate height keeping aspect ratio
        const nodeWidth = node.offsetWidth;
        const nodeHeight = node.offsetHeight;
        const imgHeight = (nodeHeight * imgWidth) / nodeWidth;

        // Check for page break
        if (currentY + imgHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }

        doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5; // Spacing between components
      }

      setStatusText('PDF Opslaan...');
      doc.save(`Transitoria_Rapport_${orientation}_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (e) {
      console.error(e);
      alert('PDF Export mislukt: ' + (e as Error).message);
    } finally {
      setIsExporting(false);
      setStatusText('');
    }
  };

  return (
    <>
      {/* Floating Excel Button (Always visible) */}
      <div className="fixed bottom-6 right-6 z-40 group flex flex-col items-end">
         <span className="mb-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
           Download Excel Data
         </span>
         <button 
           onClick={handleExcelExport}
           className="p-3 bg-green-600 text-white rounded-full shadow-xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
           title="Export zichtbare tabellen naar Excel"
         >
           <FileSpreadsheet className="w-6 h-6" />
         </button>
      </div>

      {/* PDF Option Modal */}
      {showPdfOptions && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-100 transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">PDF Export Instellingen</h3>
            <p className="text-sm text-slate-500 mb-6">Kies de gewenste oriëntatie voor het rapport.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => handlePdfExport('landscape')}
                className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <LayoutTemplate className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Liggend</span>
              </button>
              
              <button 
                onClick={() => handlePdfExport('portrait')}
                className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <Smartphone className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Staand</span>
              </button>
            </div>

            <button 
              onClick={() => setShowPdfOptions(false)}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-white/80 z-[60] flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="font-medium text-slate-700 text-lg">{statusText}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportManager;
