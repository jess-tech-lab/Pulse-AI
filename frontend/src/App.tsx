import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { DashboardV2 } from '@/components/DashboardV2';
import { useDemoMode } from '@/hooks/useDemoMode';
import {
  ImmersiveLoader,
  StillProcessing,
  NoDataFound,
} from '@/components/dashboard/ImmersiveLoader';
import './App.css';

/**
 * Demo Mode Content - Bypasses auth for public demo links
 * URL format: ?company=CompanyName
 *
 * States:
 * - loading: Initial fetch in progress
 * - polling: Actively polling for data (user clicked "Wait for Report")
 * - success: Data found and loaded
 * - no-data: No data found (shows option to start polling)
 * - timeout: Polling exceeded 60 seconds
 * - error: Fetch error
 */
function DemoContent() {
  const {
    isDemoMode,
    companyName,
    synthesis,
    status,
    pollCount,
    maxPolls,
    isPolling,
    pipelineStage,
    elapsedSeconds,
    startPolling,
    manualCheck,
  } = useDemoMode();

  if (!isDemoMode) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {/* Loading state - show minimalist loader */}
      {status === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ImmersiveLoader
            companyName={companyName}
            stage="connecting"
            isPolling={false}
          />
        </motion.div>
      )}

      {/* Polling state - show loader with poll progress */}
      {(status === 'polling' || isPolling) && status !== 'success' && (
        <motion.div
          key="polling"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ImmersiveLoader
            companyName={companyName}
            stage={pipelineStage}
            pollCount={pollCount}
            maxPolls={maxPolls}
            isPolling={true}
          />
        </motion.div>
      )}

      {/* Timeout state - polling exceeded limit */}
      {status === 'timeout' && (
        <motion.div
          key="timeout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <StillProcessing
            companyName={companyName}
            elapsedSeconds={elapsedSeconds}
            onRetry={startPolling}
            onManualCheck={manualCheck}
          />
        </motion.div>
      )}

      {/* No data state - offer to start polling */}
      {status === 'no-data' && (
        <motion.div
          key="no-data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <NoDataFound
            companyName={companyName}
            onRetry={manualCheck}
            onStartPolling={startPolling}
          />
        </motion.div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <NoDataFound
            companyName={companyName}
            onRetry={manualCheck}
            onStartPolling={startPolling}
          />
        </motion.div>
      )}

      {/* Success - fade in the dashboard */}
      {status === 'success' && synthesis && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <DashboardV2 demoMode={{ companyName, synthesis }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Authenticated Content - Standard auth flow
 */
function AuthContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardV2 />;
}

/**
 * Main App Content - Routes between demo and auth modes
 */
function AppContent() {
  const { isDemoMode } = useDemoMode();

  // Demo mode bypasses authentication
  if (isDemoMode) {
    return <DemoContent />;
  }

  // Standard authenticated flow
  return <AuthContent />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
