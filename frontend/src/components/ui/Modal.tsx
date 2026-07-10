import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  label?: string;
  labelledBy?: string;
  hideBackdrop?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  contentClassName,
  label,
  labelledBy,
  hideBackdrop,
}: ModalProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      // Focus first focusable element inside modal
      requestAnimationFrame(() => {
        const el = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        el?.focus();
      });
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
      className={cn("fixed inset-0 z-[200] flex items-center justify-center", className)}
    >
      {!hideBackdrop && (
        <div
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div className={cn("relative z-10", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
