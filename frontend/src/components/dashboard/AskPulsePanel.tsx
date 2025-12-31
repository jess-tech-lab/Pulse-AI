import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SmartSuggestion {
  label: string;
  query: string;
}

interface AskPulsePanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: SmartSuggestion[];
}

export function AskPulsePanel({ isOpen, onClose, suggestions }: AskPulsePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response - replace with actual API call
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(query),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
          >
            <div className="h-full glass border-l border-border/50 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-title">Ask Pulse</h2>
                    <p className="text-xs text-muted-foreground">
                      Ask questions about this report
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages / Suggestions */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Try one of these questions:
                    </p>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSubmit(suggestion.query)}
                          className="w-full text-left p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{suggestion.label}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted rounded-2xl px-4 py-2.5">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this report..."
                    className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSubmit(input)}
                    disabled={!input.trim() || isLoading}
                    className="rounded-xl h-11 w-11"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Mock response generator - replace with actual AI integration
function generateMockResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('performance') || lowerQuery.includes('database')) {
    return `Based on the analysis, Database Performance is the #1 issue with an impact score of 8.7/10.

Key findings:
- 25 mentions across analyzed feedback
- Trending upward (+8 from last period)
- Primarily affects Power Users and Enterprise Teams

The root cause appears to be client-side rendering bottlenecks with large datasets. Users with 5000+ pages report 30+ second load times.

Recommended action: Prioritize virtualization and lazy loading for large workspaces.`;
  }

  if (lowerQuery.includes('offline')) {
    return `Offline Mode is the #2 priority with an impact score of 7.9/10.

The analysis shows this feature is blocking mobile-first user adoption. Users frequently mention competitors like Obsidian that offer offline-first functionality.

Key segments affected: Mobile Users, Travelers, Remote Workers

Risk if not addressed: Mobile adoption remains blocked while competitor advantage widens.`;
  }

  if (lowerQuery.includes('love') || lowerQuery.includes('positive') || lowerQuery.includes('strength')) {
    return `Users strongly love three things:

1. AI Summarization (9/10 shareability)
   "What would have taken 2 hours took 30 seconds"

2. Flexibility (8/10 shareability)
   "I built my entire CRM, project tracker, and wiki in one tool"

3. Team Collaboration (8/10 shareability)
   "Real-time collaboration finally works"

Brand perception: Powerful, Flexible, Modern
Overall brand strength: 7.8/10`;
  }

  return `Based on the current report data, I found the following insights related to your question:

The analysis covers 156 total feedback items with 89 high-signal items identified. The overall sentiment is Stable with 45% positive, 32% neutral, and 23% negative feedback.

The top focus areas are:
1. Database Performance (8.7 impact)
2. Offline Mode (7.9 impact)
3. Onboarding (6.5 impact)

Would you like me to dive deeper into any specific area?`;
}
