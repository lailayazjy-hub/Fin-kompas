import React, { useEffect, useState, useRef } from 'react';
import { SourceDocument } from '../types';
import { FileText, AlertCircle, FileSpreadsheet, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Monitor } from 'lucide-react';
// @ts-ignore
import * as pdfjsImport from 'pdfjs-dist';

// Robustly handle ESM vs CommonJS/Default export structure
const pdfjsLib = (pdfjsImport as any).default || pdfjsImport;

// Initialize worker source
if (typeof window !== 'undefined' && pdfjsLib) {
  // Use a reliable CDN for the worker that matches the installed version
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface DocumentViewerProps {
  source: SourceDocument;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ source }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [fitScale, setFitScale] = useState(1.0); // The scale that fits the width exactly
  const [isLoading, setIsLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (source.originalFile) {
      const url = URL.createObjectURL(source.originalFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [source.originalFile]);

  // Handle PDF Loading
  useEffect(() => {
    if (source.originalFile?.type === 'application/pdf' && objectUrl) {
      const loadPdf = async () => {
        setIsLoading(true);
        setRenderError(null);
        try {
          const loadingTask = pdfjsLib.getDocument({
             url: objectUrl,
             cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
             cMapPacked: true,
          });
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
        } catch (err: any) {
          console.error("Error loading PDF:", err);
          setRenderError("Kan PDF niet laden. Mogelijk is het bestand beschadigd.");
        } finally {
          setIsLoading(false);
        }
      };
      loadPdf();
    } else {
        setPdfDoc(null);
    }
  }, [objectUrl, source.originalFile]);

  // AUTO-FIT WIDTH LOGIC for PDF
  // This satisfies "staandard 100% uitgezoomd" (meaning Fit Width)
  useEffect(() => {
    if (pdfDoc && containerRef.current) {
        pdfDoc.getPage(1).then((page: any) => {
            const viewport = page.getViewport({ scale: 1 });
            const containerWidth = containerRef.current?.clientWidth || 800;
            // Subtract padding (p-6 = 24px * 2 = 48px) to ensure no scrollbar at fit width
            const availableWidth = containerWidth - 48; 
            const newFitScale = availableWidth / viewport.width;
            
            if (newFitScale > 0) {
                setFitScale(newFitScale);
                setScale(newFitScale);
            }
        });
    }
  }, [pdfDoc]);

  // Handle PDF Page Rendering with High DPI Support
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        
        if (canvas) {
            const context = canvas.getContext('2d');
            
            // High DPI Rendering Logic
            // We use devicePixelRatio to ensure sharp text on high-res screens
            // or when scale is low (like DPI 14).
            const outputScale = window.devicePixelRatio || 1;

            // Set internal canvas dimensions (resolution)
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);

            // Set visual CSS dimensions (layout)
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;

            if (context) {
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                    // Apply transform to scale the content up to match the increased canvas size
                    transform: [outputScale, 0, 0, outputScale, 0, 0]
                };
                renderTask = page.render(renderContext);
                await renderTask.promise;
            }
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
            console.error("Page render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, currentPage, scale]);

  // Handler for DPI Input changes
  const handleDpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dpi = parseInt(e.target.value);
    if (!isNaN(dpi)) {
        // Clamp DPI between 14 and 300
        const clampedDpi = Math.min(Math.max(dpi, 14), 300);
        // Convert DPI back to scale (72 DPI = Scale 1.0)
        setScale(clampedDpi / 72);
    }
  };

  // Determine if we should allow horizontal scrolling
  // We allow scrolling only if zoomed in significantly past the fit scale (with small epsilon)
  const isPdfZoomed = scale > (fitScale + 0.02);

  // For Images, Scale 1.0 = Fit Width (100% of container)
  // Scale > 1.0 = Zoomed in (e.g. 150% of container)
  const isImageZoomed = scale > 1.0;

  // Demo Data check
  if (!source.originalFile) {
    return (
      <div className="w-full h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 bg-blue-50 rounded-full mb-4">
             <FileText className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-gray-900 font-semibold mb-1">Geen voorbeeld beschikbaar</h3>
        <p className="text-sm text-gray-500">
          Dit record is gegenereerd uit demodata.
        </p>
      </div>
    );
  }

  const file = source.originalFile;
  const fileName = file.name.toLowerCase();

  // 1. EXCEL VIEWER (Placeholder)
  if (source.type === 'EXCEL_SHEET' || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return (
      <div className="w-full h-64 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-emerald-800">
        <FileSpreadsheet className="w-12 h-12 mb-3 text-emerald-500" />
        <p className="font-semibold text-sm">Excel Bronbestand: <span className="font-mono">{file.name}</span></p>
        <p className="text-xs text-emerald-600 mt-1 opacity-80">Gegevens direct geëxtraheerd uit rijen.</p>
        <p className="text-xs text-emerald-600 mt-1">Geen visuele preview voor Excel.</p>
      </div>
    );
  }

  // 2. PDF VIEWER (Canvas)
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    const currentDpi = Math.round(scale * 72);

    return (
      <div className="flex flex-col h-full bg-gray-100 rounded-xl border border-gray-200 shadow-inner overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 text-sm flex-wrap gap-2">
            <div className="flex items-center gap-2">
                <button 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs text-gray-600 whitespace-nowrap">
                   Pagina {currentPage} / {numPages || '-'}
                </span>
                <button 
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-2">
                {/* DPI Control */}
                <div className="flex items-center gap-1.5 mr-2 pl-2 border-l border-gray-200" title="Instellen DPI (Dots Per Inch)">
                    <Monitor className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">DPI:</span>
                    <input 
                        type="number" 
                        min="14" 
                        max="300" 
                        step="1"
                        value={currentDpi}
                        onChange={handleDpiChange}
                        className="w-14 text-xs p-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                <button 
                    onClick={() => setScale(prev => Math.max(prev - 0.2, 0.2))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    title="Uitzoomen"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                {/* Show Zoom relative to original size for PDF context, usually user cares about legibility */}
                <span className="text-xs w-12 text-center text-gray-500">{Math.round(scale * 100)}%</span>
                <button 
                    onClick={() => setScale(prev => Math.min(prev + 0.2, 5.0))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    title="Inzoomen"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setScale(fitScale)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    title="Passend maken (Standaard)"
                >
                    <Maximize className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Content Area */}
        {/* We use overflow-x-hidden when not zoomed to prevent slight scrollbars due to rounding errors, enforcing 'Fit Width' feel */}
        <div 
           className={`flex-1 bg-gray-100 flex justify-center p-6 relative min-h-[600px] ${isPdfZoomed ? 'overflow-x-auto' : 'overflow-x-hidden'}`} 
           ref={containerRef}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
            
            {renderError ? (
                <div className="text-center mt-10 text-gray-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-400" />
                    <p>{renderError}</p>
                </div>
            ) : (
                <canvas 
                    ref={canvasRef} 
                    className="shadow-lg transition-transform duration-200 ease-out bg-white"
                />
            )}
        </div>
      </div>
    );
  }

  // 3. IMAGE VIEWER
  if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/.test(fileName)) {
    return (
      <div className="flex flex-col h-full bg-gray-100 rounded-xl border border-gray-200 shadow-inner overflow-hidden min-h-[600px]">
        {/* Simple Toolbar for Image */}
         <div className="flex items-center justify-end px-4 py-2 bg-white border-b border-gray-200 text-sm">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setScale(prev => Math.max(prev - 0.25, 0.25))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                 <span className="text-xs w-12 text-center text-gray-500">{Math.round(scale * 100)}%</span>
                <button 
                    onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                 <button 
                    onClick={() => setScale(1)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    title="Passend maken (Standaard)"
                >
                    <Maximize className="w-4 h-4" />
                </button>
            </div>
         </div>

         {/* Image Content */}
         <div className={`flex-1 bg-gray-100 flex items-start justify-center p-6 ${isImageZoomed ? 'overflow-auto' : 'overflow-hidden'}`}>
             {objectUrl && (
                <img 
                    src={objectUrl} 
                    alt="Document" 
                    className="shadow-lg transition-all duration-200 ease-out bg-white origin-top"
                    style={{ 
                        // Scale 1 = 100% of container (Fit Width)
                        // Scale > 1 = Zoomed relative to container width
                        width: `${scale * 100}%`,
                        height: 'auto'
                    }}
                />
             )}
         </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full h-64 bg-gray-50 flex flex-col items-center justify-center text-gray-400 rounded-xl border border-gray-200">
      <AlertCircle className="w-10 h-10 mb-2 opacity-30" />
      <span className="font-medium text-gray-600">Bestandstype niet ondersteund voor preview</span>
      <span className="text-xs mt-1 font-mono text-gray-400">{file.name}</span>
    </div>
  );
};

export default DocumentViewer;