import { useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface UseToastReturn {
  toast: (props: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toast, toasts, removeToast };
} 