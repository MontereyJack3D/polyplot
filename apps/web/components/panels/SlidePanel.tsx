'use client';

import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

import { useIsMobile } from '@/lib/hooks/use-is-mobile';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  width = 'md',
  children,
}: SlidePanelProps) {
  const widthMap = { sm: 380, md: 480, lg: 600 };
  const w = widthMap[width];
  const isMobile = useIsMobile();
  const effectiveWidth = isMobile ? '100vw' : `${w}px`;
  const hiddenX = isMobile ? '100%' : w;

  useEffect(() => {
    const closeHandler = () => onClose();
    window.addEventListener('polyplot:close-panels', closeHandler);
    return () => window.removeEventListener('polyplot:close-panels', closeHandler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: hiddenX }}
            animate={{ x: 0 }}
            exit={{ x: hiddenX }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full bg-card border-l border-border z-50 overflow-y-auto"
            style={{ width: effectiveWidth }}
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {icon && <div className="text-primary">{icon}</div>}
                <div>
                  <h2 className="text-foreground text-[16px] font-medium">{title}</h2>
                  {subtitle && <p className="text-muted-foreground text-[12px]">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
