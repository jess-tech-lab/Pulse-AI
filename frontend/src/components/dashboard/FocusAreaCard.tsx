import { motion } from 'framer-motion';
import {
  Lightbulb,
  MousePointer2,
  Bug,
  Heart,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { FocusArea, FocusAreaCategory } from '@/types';

interface FocusAreaCardProps {
  focusArea: FocusArea;
  index: number;
  onAskPulse?: (question: string) => void;
}

const categoryConfig: Record<FocusAreaCategory, {
  color: string;
  bg: string;
  label: string;
  icon: React.ElementType;
}> = {
  feature_request: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'Feature',
    icon: Lightbulb,
  },
  usability_friction: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    label: 'Usability',
    icon: MousePointer2,
  },
  bug: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    label: 'Bug',
    icon: Bug,
  },
  praise: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    label: 'Praise',
    icon: Heart,
  },
};

const TrendBadge = ({ trend, delta }: { trend: string; delta: number }) => {
  if (trend === 'new') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary/15 text-primary">
        <Sparkles className="w-3 h-3" />
        NEW
      </span>
    );
  }
  if (trend === 'up') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
        style={{ backgroundColor: '#ffebee', color: '#c2052f' }}
      >
        RISING +{Math.abs(delta)}
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
        style={{ backgroundColor: '#f1f8e9', color: '#558b2f' }}
      >
        DECLINING -{Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
      STABLE
    </span>
  );
};

function truncateQuote(quote: string, maxLength: number = 100): string {
  if (quote.length <= maxLength) return quote;
  return quote.slice(0, maxLength).trim() + '...';
}

export function FocusAreaCard({ focusArea, index, onAskPulse }: FocusAreaCardProps) {
  const config = categoryConfig[focusArea.category] || categoryConfig.usability_friction;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="h-full"
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="h-full"
      >
        <GlassCard
          hover={false}
          animate={false}
          className="h-full flex flex-col p-4 hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${config.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
            <TrendBadge trend={focusArea.trend} delta={focusArea.trendDelta} />
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2">
            {focusArea.title}
          </h3>

          {/* Score & Frequency */}
          <div className="flex items-baseline gap-2 mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-2xl font-bold text-foreground cursor-help">
                  {focusArea.impactScore.toFixed(1)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{focusArea.scoreRationale}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    Impact = (R×0.4) + (S×0.3) + (V×0.3)
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            <span className="text-sm text-muted-foreground">impact</span>
            <span className="text-sm text-muted-foreground ml-auto">
              {focusArea.frequency} mentions
            </span>
          </div>

          {/* Quote - Truncated */}
          {focusArea.topQuote && (
            <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3 mb-3 line-clamp-2">
              "{truncateQuote(focusArea.topQuote)}"
            </blockquote>
          )}

          {/* Stakes - High contrast for accessibility */}
          <div
            className="text-xs px-3 py-2 rounded-lg mb-3"
            style={
              focusArea.stakes.type === 'risk'
                ? { backgroundColor: '#ffe8e8', color: '#d32f2f' }
                : focusArea.stakes.type === 'upside'
                ? { backgroundColor: '#e8f5e9', color: '#2e7d32' }
                : { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }
            }
          >
            <span className="line-clamp-2">{focusArea.stakes.message}</span>
          </div>

          {/* Footer: Segments + Ask Pulse */}
          <div className="mt-auto pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {focusArea.affectedSegments.slice(0, 2).map((segment, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-muted/70 rounded text-xs text-muted-foreground"
                  >
                    {segment}
                  </span>
                ))}
                {focusArea.affectedSegments.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                    +{focusArea.affectedSegments.length - 2}
                  </span>
                )}
              </div>
              {onAskPulse && (
                <button
                  onClick={() => onAskPulse(`Why is "${focusArea.title}" trending ${focusArea.trend}?`)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  Ask
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
