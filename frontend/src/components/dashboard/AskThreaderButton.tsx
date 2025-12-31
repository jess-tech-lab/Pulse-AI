import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface AskThreaderButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AskThreaderButton({ isOpen, onToggle }: AskThreaderButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg shadow-primary/25
        transition-colors duration-200
        ${isOpen
          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            <X className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.15 }}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
