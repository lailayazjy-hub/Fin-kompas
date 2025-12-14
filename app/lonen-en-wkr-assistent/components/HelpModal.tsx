import React from 'react';
import { X, BookOpen, Calculator, AlertTriangle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, appName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            Handleiding {appName}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-gray-600">
          <section className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
              Instellingen & Loonsom
            </h3>
            <p>
              Ga naar de <strong>Instellingen</strong> (tandwiel-icoon) en vul de fiscale loonsom van je organisatie in voor het huidige jaar. Dit is de basis voor de berekening van de vrije ruimte. Controleer ook of je de juiste analyseperiode (bijv. 2025) hanteert in de datumfilters.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
              Kosten Categoriseren
            </h3>
            <p>Voer je uitgaven in via de upload of de 'Nieuwe Boeking' knop en kies de juiste categorie:</p>
            <ul className="list-disc pl-9 space-y-1">
              <li><strong>Vrije ruimte:</strong> Algemene kosten die niet zijn vrijgesteld (bijv. kerstpakketten, fiets van de zaak zonder eigen bijdrage). Dit "Algemeen forfait" wordt getoetst aan je budget.</li>
              <li><strong>Gerichte vrijstelling:</strong> Specifieke zakelijke kosten (bijv. reiskosten OV/km, scholing, zakelijk internet).</li>
              <li><strong>Nihilwaardering:</strong> Voorzieningen op de werkplek (bijv. koffie/thee op kantoor, werkkleding).</li>
              <li><strong>Intermediaire kosten:</strong> Voorgeschoten bedragen voor de werkgever.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
              Analyse & Eindheffing
            </h3>
            <p>
              Het dashboard toont direct of de som van de uitgaven in de vrije ruimte binnen het budget blijft.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start text-sm">
                <Calculator className="shrink-0 text-blue-500 mt-0.5" size={18} />
                <div>
                    Als je boven de vrije ruimte komt, berekent de tool automatisch de <strong>80% eindheffing</strong> over het overschrijdende bedrag.
                </div>
            </div>
          </section>

          <section className="space-y-3">
             <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Aandachtspunten
            </h3>
            <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-900 border border-amber-100">
                <ul className="space-y-2">
                    <li className="flex gap-2">
                        <span className="font-bold">•</span>
                        <span><strong>Noodzakelijkheidscriterium:</strong> Voor kostenposten met een privé-component (zoals telefoons, laptops, auto van de zaak) moet je goed beoordelen of deze noodzakelijk zijn voor het werk.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold">•</span>
                        <span><strong>Gebruikelijkheidstoets:</strong> De vergoeding mag niet meer dan 30% afwijken van wat gebruikelijk is. De tool toetst hier niet automatisch op; dit blijft een aandachtspunt tijdens de jaarafsluiting.</span>
                    </li>
                </ul>
            </div>
          </section>
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Begrepen
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;