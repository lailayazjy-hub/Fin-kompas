import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Database } from 'lucide-react';
import { Theme } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onLoadDemo: () => void;
  isProcessing: boolean;
  error?: string | null;
  theme?: Theme;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onLoadDemo, isProcessing, error, theme }) => {
  const [dragActive, setDragActive] = useState(false);
  const primaryColor = theme?.colors.primary || '#2563eb'; // Default blue

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 p-6">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 rounded-xl transition-all overflow-hidden
        ${dragActive ? 'bg-blue-50 border-solid' : 'bg-white hover:bg-gray-50 border-dashed'}
        ${isProcessing ? 'pointer-events-none border-solid bg-gray-50' : 'cursor-pointer'}`}
        style={{ borderColor: isProcessing ? primaryColor : (dragActive ? primaryColor : '#d1d5db') }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          id="dropzone-file" 
          type="file" 
          className="hidden" 
          accept="application/pdf,image/png,image/jpeg,image/jpg,.xlsx,.xls"
          onChange={handleChange}
          disabled={isProcessing}
        />
        
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full">
          {isProcessing ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full px-10">
              <div className="relative mb-4">
                 <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                 <Loader2 className="w-12 h-12 animate-spin relative z-10" style={{ color: primaryColor }} />
              </div>
              <p className="text-lg text-gray-800 font-semibold">Document wordt verwerkt...</p>
              <p className="text-sm text-gray-500 mt-1 mb-6">Financiële data & tabbladen extraheren</p>
              
              {/* Indeterminate Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                 <div className="absolute top-0 left-0 h-full w-1/2 bg-current rounded-full animate-[shimmer_1.5s_infinite]" 
                      style={{ backgroundColor: primaryColor, animation: 'slide-indeterminate 1.5s infinite ease-in-out' }}>
                 </div>
              </div>
              <style>{`
                @keyframes slide-indeterminate {
                  0% { transform: translateX(-100%); width: 20%; }
                  50% { width: 60%; }
                  100% { transform: translateX(200%); width: 20%; }
                }
              `}</style>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-full mb-4 shadow-sm" style={{ backgroundColor: `${primaryColor}15` }}>
                <Upload className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <p className="mb-2 text-sm text-gray-700 font-semibold">
                <span className="font-bold" style={{ color: primaryColor }}>Klik om te uploaden</span> of sleep bestanden hierheen
              </p>
              <p className="text-xs text-gray-500">PDF, Excel (XLSX), Afbeeldingen</p>
            </>
          )}
        </label>
      </div>

      <div className="mt-6 flex justify-center">
          <button 
            onClick={onLoadDemo}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
              <Database className="w-4 h-4" /> Laad Demo Data
          </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-100 transition-colors">
          <FileText className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-gray-900">Multi-Bron</h3>
          <p className="text-[10px] text-gray-500">Excel Tabs & PDFs</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-100 transition-colors">
          <Loader2 className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-gray-900">AI Analyse</h3>
          <p className="text-[10px] text-gray-500">Auto-Extractie</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-100 transition-colors">
          <Upload className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-gray-900">Geconsolideerd</h3>
          <p className="text-[10px] text-gray-500">FC Dashboard View</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;