
import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, FileText, FolderInput, Users, TrendingUp, BookText, ScrollText } from 'lucide-react';
import { ThemeColors } from '../types';

interface FileDropZoneProps {
  onFilesDropped: (files: FileList) => void;
  onClose: () => void;
  colors: ThemeColors;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesDropped, onClose, colors }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  }, [onFilesDropped]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative w-full max-w-4xl mx-4">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
        >
          <X size={32} />
        </button>

        <div 
          className={`bg-white rounded-2xl p-12 text-center border-4 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 scale-105 shadow-2xl' 
              : 'border-gray-300 shadow-xl'
          }`}
          style={{ borderColor: isDragging ? colors.primary : undefined }}
        >
          <div className="flex justify-center mb-6">
            <div className={`p-6 rounded-full transition-all duration-300 ${isDragging ? 'bg-white scale-110' : 'bg-gray-100'}`}>
              <UploadCloud size={64} style={{ color: isDragging ? colors.primary : '#9CA3AF' }} />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Sleep alles in één keer!
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">
            Gooi al uw bestanden in deze zone. Wij sorteren en verwerken automatisch:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-teal-600">
                    <ScrollText size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-xs">Loonstaat</span>
             </div>

             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                    <FileSpreadsheet size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-xs">WKR Uitgaven</span>
             </div>
             
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
                    <Users size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-xs">Lonen & Pers.</span>
             </div>
             
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-500">
                    <FileText size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-xs">Bank Bestanden</span>
             </div>
             
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
                    <TrendingUp size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-xs">Schalen</span>
             </div>
             
             <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500">
                    <BookText size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-xs">Journaal</span>
             </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-400">
            Ondersteunde formaten: .csv, .xlsx, .pdf, .xml
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDropZone;
