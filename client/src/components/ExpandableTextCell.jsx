import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';

export default function ExpandableTextCell({ 
  text, 
  maxLength = 65, 
  modalTitle = "Details", 
  extraDetails = null 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen]);

  if (!text) return <span className="text-text-muted italic">N/A</span>;

  const isLong = text.length > maxLength;
  const displayText = isLong ? text.slice(0, maxLength).trim() + '...' : text;

  return (
    <>
      <div className="flex flex-col items-start">
        <span className="text-text-secondary whitespace-normal break-words">
          {displayText}
        </span>
        {isLong && (
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering row clicks if any
              setIsModalOpen(true);
            }}
            className="mt-1 text-[11px] font-bold text-accent-blue hover:text-blue-700 hover:underline transition-colors uppercase tracking-wider"
          >
            More Info
          </button>
        )}
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
        >
          <div 
            className="bg-bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-line-light flex justify-between items-center bg-bg-secondary">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <FileText size={16} className="text-text-muted" />
                {modalTitle}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-xl hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto custom-scrollbar">
                {text}
              </div>
              
              {extraDetails && (
                <div className="mt-4 pt-4 border-t border-line-light">
                  {extraDetails}
                </div>
              )}
            </div>
            
            <div className="px-5 py-4 bg-bg-secondary border-t border-line-light flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-bg-card border border-line rounded-2xl text-sm font-semibold text-text-primary hover:bg-table-row-alt transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
