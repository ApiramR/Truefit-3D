import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '../hooks/useToast';

interface ToastContextType {
  toast: (props: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
} 