import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              toast.variant === 'destructive'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{toast.title}</h3>
                <p className="text-sm mt-1">{toast.description}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-current hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 