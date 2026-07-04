import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  bodyText = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  iconType = "warning", // 'warning' or 'danger'
  previewContent = null,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Enter explicitly NOT triggering confirm per requirements
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const IconComponent = iconType === 'danger' ? Trash2 : AlertTriangle;

  // Emphasize "cannot be undone" subtly
  const formattedBodyText = bodyText.split('cannot be undone').map((part, index, array) => {
    if (index === array.length - 1) return part;
    return (
      <React.Fragment key={index}>
        {part}
        <span className="text-amber-600 dark:text-amber-500">cannot be undone</span>
      </React.Fragment>
    );
  });

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-bg-card w-full max-w-[420px] rounded-xl shadow-xl border border-line animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="p-6">
          <div className="flex items-start mb-4">
            <IconComponent size={28} className="text-red-600 mr-3 shrink-0 mt-0.5" />
            <div>
              <h2 id="confirm-modal-title" className="text-[18px] font-bold text-text-primary mb-2">
                {title}
              </h2>
              <p className="text-[13px] md:text-[14px] text-text-secondary leading-relaxed">
                {formattedBodyText}
              </p>
            </div>
          </div>
          
          {previewContent && (
            <div className="mt-4 bg-bg-secondary p-3 rounded-lg border border-line flex items-center gap-2">
              {previewContent}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-line flex justify-end gap-3 bg-bg-card">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-line hover:bg-bg-secondary rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center shadow-sm"
          >
            {iconType === 'danger' && <Trash2 size={16} className="mr-2" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
