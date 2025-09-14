'use client';

import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  // Close on escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      onMouseDown={e => {
        // if click backdrop, close
        if ((e.target as HTMLElement).dataset.modal !== undefined) onClose();
      }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 ${className}`}
        onMouseDown={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {children}
      </div>
    </div>
  );
}

// Optional header/footer helpers
export function ModalHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-6 pb-3 font-semibold text-lg border-b border-gray-200">
      {children}
    </div>
  );
}
export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-4">{children}</div>;
}
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pb-5 pt-3 flex justify-end gap-2 border-t border-gray-100">
      {children}
    </div>
  );
}
