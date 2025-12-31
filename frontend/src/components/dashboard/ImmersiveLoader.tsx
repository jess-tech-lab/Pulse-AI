import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Pipeline stages for progress tracking
export type PipelineStage = 'connecting' | 'discovery' | 'scraping' | 'analyzing' | 'synthesizing' | 'complete' | 'polling';

// Cycling tips based on company name
const generateTips = (companyName: string) => [
  `Scouting subreddits for ${companyName}...`,
  `Collecting user feedback...`,
  `Analyzing sentiment patterns...`,
  `Identifying growth opportunities...`,
  `Synthesizing strategic insights...`,
  `Building your report...`,
];

interface ImmersiveLoaderProps {
  companyName: string;
  stage?: PipelineStage;
  pollCount?: number;
  maxPolls?: number;
  isPolling?: boolean;
}

/**
 * Minimalist Apple-like Loading Screen
 * Features: Iridescent gradient background, centered content, sleek progress bar
 */
export function ImmersiveLoader({
  companyName,
  stage = 'connecting',
  pollCount = 0,
  maxPolls = 20,
  isPolling = false,
}: ImmersiveLoaderProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const tips = generateTips(companyName);

  // Cycle through tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Calculate progress based on stage or poll count
  const getProgress = () => {
    if (isPolling) {
      const pollProgress = Math.min(pollCount / maxPolls, 1);
      return 15 + pollProgress * 80;
    }

    const stages: PipelineStage[] = ['connecting', 'discovery', 'scraping', 'analyzing', 'synthesizing', 'complete'];
    const stageIndex = stages.indexOf(stage);
    if (stageIndex === -1) return 10;
    return ((stageIndex + 1) / stages.length) * 100;
  };

  // Smooth progress animation
  useEffect(() => {
    const target = getProgress();
    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) {
          clearInterval(interval);
          return target;
        }
        return prev + diff * 0.12;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [stage, pollCount, isPolling]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Multi-layer organic gradient background */}
      <div className="absolute inset-0 bg-white" />

      {/* Layer 1: Large soft pink bloom - slow drift */}
      <div className="absolute inset-0 gradient-blob gradient-blob-1" />

      {/* Layer 2: Purple/blue bloom - medium drift */}
      <div className="absolute inset-0 gradient-blob gradient-blob-2" />

      {/* Layer 3: Mint/green bloom - different rhythm */}
      <div className="absolute inset-0 gradient-blob gradient-blob-3" />

      {/* Layer 4: Warm yellow/peach accent - subtle pulse */}
      <div className="absolute inset-0 gradient-blob gradient-blob-4" />

      {/* Subtle grain overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Centered Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center px-6 max-w-md w-full"
      >
        {/* Pulsing Blob */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="pulse-blob" />
        </motion.div>

        {/* Company Name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-semibold text-gray-900 mb-2 text-center"
        >
          {companyName}
        </motion.h1>

        {/* Progress Bar Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-xs mb-6 mt-4"
        >
          {/* Progress Track */}
          <div className="h-1 bg-gray-900/10 rounded-full overflow-hidden">
            {/* Progress Fill */}
            <motion.div
              className="h-full bg-gray-900/70 rounded-full"
              style={{ width: `${animatedProgress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Progress Percentage */}
          <div className="flex justify-end mt-2">
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {Math.round(animatedProgress)}%
            </span>
          </div>
        </motion.div>

        {/* Dynamic Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="h-6 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTipIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-gray-500 text-center"
            >
              {tips[currentTipIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Polling indicator (subtle) */}
        {isPolling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex items-center gap-2 text-xs text-gray-400"
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Checking for results...</span>
          </motion.div>
        )}
      </motion.div>

      {/* CSS for organic multi-layer gradient animation */}
      <style>{`
        .gradient-blob {
          position: absolute;
          inset: 0;
          opacity: 0.7;
          filter: blur(80px);
          will-change: transform, opacity;
        }

        /* Layer 1: Soft pink - large, slow breathing movement */
        .gradient-blob-1 {
          background: radial-gradient(
            ellipse 80% 60% at 20% 30%,
            rgba(253, 242, 248, 0.9) 0%,
            rgba(252, 231, 243, 0.6) 40%,
            transparent 70%
          );
          animation: drift1 20s ease-in-out infinite, breathe1 8s ease-in-out infinite;
        }

        /* Layer 2: Purple/violet - drifts opposite direction */
        .gradient-blob-2 {
          background: radial-gradient(
            ellipse 70% 80% at 80% 20%,
            rgba(237, 233, 254, 0.8) 0%,
            rgba(221, 214, 254, 0.5) 45%,
            transparent 70%
          );
          animation: drift2 25s ease-in-out infinite, breathe2 12s ease-in-out infinite;
        }

        /* Layer 3: Mint/teal - bottom area, slow rotation feel */
        .gradient-blob-3 {
          background: radial-gradient(
            ellipse 90% 50% at 50% 90%,
            rgba(209, 250, 229, 0.7) 0%,
            rgba(167, 243, 208, 0.4) 50%,
            transparent 70%
          );
          animation: drift3 18s ease-in-out infinite, breathe3 10s ease-in-out infinite;
        }

        /* Layer 4: Warm peach/yellow - accent that fades in/out */
        .gradient-blob-4 {
          background: radial-gradient(
            ellipse 50% 50% at 70% 60%,
            rgba(254, 243, 199, 0.6) 0%,
            rgba(254, 215, 170, 0.3) 50%,
            transparent 70%
          );
          animation: drift4 22s ease-in-out infinite, pulse4 6s ease-in-out infinite;
        }

        /* Drift animations - each blob moves in its own organic path */
        @keyframes drift1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25% { transform: translate(5%, 10%) scale(1.05); }
          50% { transform: translate(-5%, 5%) scale(0.95); }
          75% { transform: translate(8%, -5%) scale(1.02); }
        }

        @keyframes drift2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(-10%, 8%) scale(1.08); }
          66% { transform: translate(5%, -10%) scale(0.92); }
        }

        @keyframes drift3 {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
          50% { transform: translate(10%, -5%) rotate(3deg); }
        }

        @keyframes drift4 {
          0%, 100% { transform: translate(0%, 0%); }
          30% { transform: translate(-15%, 10%); }
          60% { transform: translate(10%, -8%); }
        }

        /* Breathing animations - opacity pulses */
        @keyframes breathe1 {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.5; }
        }

        @keyframes breathe2 {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }

        @keyframes breathe3 {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.7; }
        }

        @keyframes pulse4 {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

interface StillProcessingProps {
  companyName: string;
  elapsedSeconds: number;
  onRetry: () => void;
  onManualCheck: () => void;
}

/**
 * Minimalist "Still Processing" state
 */
export function StillProcessing({
  companyName,
  elapsedSeconds,
  onRetry,
  onManualCheck,
}: StillProcessingProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Multi-layer organic gradient background */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 gradient-blob gradient-blob-1" />
      <div className="absolute inset-0 gradient-blob gradient-blob-2" />
      <div className="absolute inset-0 gradient-blob gradient-blob-3" />
      <div className="absolute inset-0 gradient-blob gradient-blob-4" />

      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full text-center"
      >
        {/* Amber indicator */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6"
        >
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
        </motion.div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Taking longer than expected
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-2">
          Analysis for <span className="font-medium text-gray-700">{companyName}</span> is still running
        </p>

        {/* Timer */}
        <p className="text-xs text-gray-400 mb-8 tabular-nums">
          {elapsedSeconds}s elapsed
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onManualCheck}
            variant="default"
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-5"
          >
            Check Again
          </Button>
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 rounded-full px-5"
          >
            Restart
          </Button>
        </div>
      </motion.div>

      {/* Shared gradient styles */}
      <style>{`
        .gradient-blob {
          position: absolute;
          inset: 0;
          opacity: 0.7;
          filter: blur(80px);
          will-change: transform, opacity;
        }
        .gradient-blob-1 {
          background: radial-gradient(ellipse 80% 60% at 20% 30%, rgba(253, 242, 248, 0.9) 0%, rgba(252, 231, 243, 0.6) 40%, transparent 70%);
          animation: drift1 20s ease-in-out infinite, breathe1 8s ease-in-out infinite;
        }
        .gradient-blob-2 {
          background: radial-gradient(ellipse 70% 80% at 80% 20%, rgba(237, 233, 254, 0.8) 0%, rgba(221, 214, 254, 0.5) 45%, transparent 70%);
          animation: drift2 25s ease-in-out infinite, breathe2 12s ease-in-out infinite;
        }
        .gradient-blob-3 {
          background: radial-gradient(ellipse 90% 50% at 50% 90%, rgba(209, 250, 229, 0.7) 0%, rgba(167, 243, 208, 0.4) 50%, transparent 70%);
          animation: drift3 18s ease-in-out infinite, breathe3 10s ease-in-out infinite;
        }
        .gradient-blob-4 {
          background: radial-gradient(ellipse 50% 50% at 70% 60%, rgba(254, 243, 199, 0.6) 0%, rgba(254, 215, 170, 0.3) 50%, transparent 70%);
          animation: drift4 22s ease-in-out infinite, pulse4 6s ease-in-out infinite;
        }
        @keyframes drift1 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 25% { transform: translate(5%, 10%) scale(1.05); } 50% { transform: translate(-5%, 5%) scale(0.95); } 75% { transform: translate(8%, -5%) scale(1.02); } }
        @keyframes drift2 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 33% { transform: translate(-10%, 8%) scale(1.08); } 66% { transform: translate(5%, -10%) scale(0.92); } }
        @keyframes drift3 { 0%, 100% { transform: translate(0%, 0%) rotate(0deg); } 50% { transform: translate(10%, -5%) rotate(3deg); } }
        @keyframes drift4 { 0%, 100% { transform: translate(0%, 0%); } 30% { transform: translate(-15%, 10%); } 60% { transform: translate(10%, -8%); } }
        @keyframes breathe1 { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.5; } }
        @keyframes breathe2 { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.8; } }
        @keyframes breathe3 { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.7; } }
        @keyframes pulse4 { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

interface NoDataFoundProps {
  companyName: string;
  onRetry: () => void;
  onStartPolling: () => void;
}

/**
 * Minimalist "No Data Found" state
 */
export function NoDataFound({
  companyName,
  onRetry,
  onStartPolling,
}: NoDataFoundProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Multi-layer organic gradient background */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 gradient-blob gradient-blob-1" />
      <div className="absolute inset-0 gradient-blob gradient-blob-2" />
      <div className="absolute inset-0 gradient-blob gradient-blob-3" />
      <div className="absolute inset-0 gradient-blob gradient-blob-4" />

      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full text-center"
      >
        {/* Empty state indicator */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-full bg-gray-900/5 flex items-center justify-center mb-6"
        >
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400" />
        </motion.div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No report found
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-6">
          Generate a report for <span className="font-medium text-gray-700">{companyName}</span>
        </p>

        {/* Command hint */}
        <div className="bg-gray-900/5 rounded-xl px-4 py-3 mb-8 w-full">
          <code className="text-sm font-mono text-gray-700">
            npm run scout "{companyName}"
          </code>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onStartPolling}
            variant="default"
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-5"
          >
            Wait for Report
          </Button>
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 rounded-full px-5"
          >
            Try Again
          </Button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 mt-6">
          "Wait for Report" checks every 3 seconds
        </p>
      </motion.div>

      {/* Shared gradient styles */}
      <style>{`
        .gradient-blob {
          position: absolute;
          inset: 0;
          opacity: 0.7;
          filter: blur(80px);
          will-change: transform, opacity;
        }
        .gradient-blob-1 {
          background: radial-gradient(ellipse 80% 60% at 20% 30%, rgba(253, 242, 248, 0.9) 0%, rgba(252, 231, 243, 0.6) 40%, transparent 70%);
          animation: drift1 20s ease-in-out infinite, breathe1 8s ease-in-out infinite;
        }
        .gradient-blob-2 {
          background: radial-gradient(ellipse 70% 80% at 80% 20%, rgba(237, 233, 254, 0.8) 0%, rgba(221, 214, 254, 0.5) 45%, transparent 70%);
          animation: drift2 25s ease-in-out infinite, breathe2 12s ease-in-out infinite;
        }
        .gradient-blob-3 {
          background: radial-gradient(ellipse 90% 50% at 50% 90%, rgba(209, 250, 229, 0.7) 0%, rgba(167, 243, 208, 0.4) 50%, transparent 70%);
          animation: drift3 18s ease-in-out infinite, breathe3 10s ease-in-out infinite;
        }
        .gradient-blob-4 {
          background: radial-gradient(ellipse 50% 50% at 70% 60%, rgba(254, 243, 199, 0.6) 0%, rgba(254, 215, 170, 0.3) 50%, transparent 70%);
          animation: drift4 22s ease-in-out infinite, pulse4 6s ease-in-out infinite;
        }
        @keyframes drift1 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 25% { transform: translate(5%, 10%) scale(1.05); } 50% { transform: translate(-5%, 5%) scale(0.95); } 75% { transform: translate(8%, -5%) scale(1.02); } }
        @keyframes drift2 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 33% { transform: translate(-10%, 8%) scale(1.08); } 66% { transform: translate(5%, -10%) scale(0.92); } }
        @keyframes drift3 { 0%, 100% { transform: translate(0%, 0%) rotate(0deg); } 50% { transform: translate(10%, -5%) rotate(3deg); } }
        @keyframes drift4 { 0%, 100% { transform: translate(0%, 0%); } 30% { transform: translate(-15%, 10%); } 60% { transform: translate(10%, -8%); } }
        @keyframes breathe1 { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.5; } }
        @keyframes breathe2 { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.8; } }
        @keyframes breathe3 { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.7; } }
        @keyframes pulse4 { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
