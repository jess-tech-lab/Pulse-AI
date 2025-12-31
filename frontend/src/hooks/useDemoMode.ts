import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sampleSynthesisV2 } from '@/data/sampleDataV2';
import type { SynthesisReportV2 } from '@/types';
import type { PipelineStage } from '@/components/dashboard/ImmersiveLoader';

type DataSource = 'supabase' | 'demo-config' | 'none';
type FetchStatus = 'idle' | 'loading' | 'polling' | 'success' | 'error' | 'no-data' | 'timeout';

interface DemoState {
  companyName: string;
  synthesis: SynthesisReportV2 | null;
  status: FetchStatus;
  dataSource: DataSource;
  error: string | null;
  lastFetchedAt: Date | null;
  // Polling state
  pollCount: number;
  maxPolls: number;
  isPolling: boolean;
  pipelineStage: PipelineStage;
  elapsedSeconds: number;
}

interface UseDemoModeReturn extends DemoState {
  isDemoMode: boolean;
  isLoading: boolean;
  retry: () => void;
  refetch: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  manualCheck: () => void;
}

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_COUNT = 20; // 20 * 3s = 60 seconds max
const INITIAL_FETCH_TIMEOUT = 5000; // 5 seconds for initial fetch

/**
 * Hook to detect and handle public demo mode with polling support
 * Checks for ?company=NAME query parameter
 * Single source of truth for demo data fetching
 */
export function useDemoMode(): UseDemoModeReturn {
  const [state, setState] = useState<DemoState>({
    companyName: '',
    synthesis: null,
    status: 'idle',
    dataSource: 'none',
    error: null,
    lastFetchedAt: null,
    pollCount: 0,
    maxPolls: MAX_POLL_COUNT,
    isPolling: false,
    pipelineStage: 'connecting',
    elapsedSeconds: 0,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Check URL params for demo mode
  const urlParams = new URLSearchParams(window.location.search);
  const companyParam = urlParams.get('company');
  const isDemoMode = !!companyParam;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, []);

  // Single fetch attempt to Supabase
  const fetchFromSupabase = useCallback(async (company: string): Promise<SynthesisReportV2 | null> => {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('snapshots')
        .select('synthesis_data, company_name, created_at')
        .ilike('company_name', company)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && !error) {
        console.log('[Demo Mode] Found data for:', data[0].company_name);
        return data[0].synthesis_data as SynthesisReportV2;
      }

      if (error) {
        console.warn('[Demo Mode] Supabase error:', error.message);
      }

      return null;
    } catch (err) {
      console.warn('[Demo Mode] Fetch error:', err);
      return null;
    }
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isPolling: false }));
    }
  }, []);

  // Start polling for data
  const startPolling = useCallback(() => {
    if (!companyParam) return;

    console.log('[Demo Mode] Starting polling for:', companyParam);

    // Reset state for polling
    setState(prev => ({
      ...prev,
      status: 'polling',
      isPolling: true,
      pollCount: 0,
      elapsedSeconds: 0,
      pipelineStage: 'discovery',
      error: null,
    }));

    // Start elapsed time counter
    elapsedIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }
    }, 1000);

    // Polling function
    const poll = async () => {
      if (!isMountedRef.current) return;

      setState(prev => {
        const newPollCount = prev.pollCount + 1;

        // Update pipeline stage based on poll count
        let newStage: PipelineStage = 'discovery';
        if (newPollCount > 4) newStage = 'scraping';
        if (newPollCount > 8) newStage = 'analyzing';
        if (newPollCount > 12) newStage = 'synthesizing';

        // Check if we've exceeded max polls
        if (newPollCount >= MAX_POLL_COUNT) {
          stopPolling();
          return {
            ...prev,
            status: 'timeout',
            isPolling: false,
            pollCount: newPollCount,
            error: 'Analysis is taking longer than expected. The scout command may still be running.',
          };
        }

        return {
          ...prev,
          pollCount: newPollCount,
          pipelineStage: newStage,
        };
      });

      // Attempt to fetch
      const synthesis = await fetchFromSupabase(companyParam);

      if (synthesis && isMountedRef.current) {
        console.log('[Demo Mode] Polling found data!');
        stopPolling();
        setState(prev => ({
          ...prev,
          synthesis,
          status: 'success',
          dataSource: 'supabase',
          isPolling: false,
          pipelineStage: 'complete',
          lastFetchedAt: new Date(),
        }));
      }
    };

    // Start polling interval
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Also do an immediate check
    poll();
  }, [companyParam, fetchFromSupabase, stopPolling]);

  // Initial fetch (without polling)
  const fetchDemoData = useCallback(async (company: string, enablePollingOnFail = false) => {
    console.log('[Demo Mode] Starting fetch for:', company);

    setState(prev => ({
      ...prev,
      companyName: company,
      status: 'loading',
      error: null,
      synthesis: null,
      pipelineStage: 'connecting',
    }));

    // Try Supabase with timeout
    if (isSupabaseConfigured && supabase) {
      try {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), INITIAL_FETCH_TIMEOUT)
        );

        const fetchPromise = fetchFromSupabase(company);
        const synthesis = await Promise.race([fetchPromise, timeoutPromise]);

        if (synthesis && isMountedRef.current) {
          console.log('[Demo Mode] Initial fetch found data');
          setState({
            companyName: company,
            synthesis,
            status: 'success',
            dataSource: 'supabase',
            error: null,
            lastFetchedAt: new Date(),
            pollCount: 0,
            maxPolls: MAX_POLL_COUNT,
            isPolling: false,
            pipelineStage: 'complete',
            elapsedSeconds: 0,
          });
          return;
        }
      } catch (err) {
        console.warn('[Demo Mode] Initial fetch error:', err);
      }
    }

    // Try demo-config.json fallback
    try {
      const response = await fetch('/demo-config.json');
      if (response.ok) {
        const config = await response.json();
        // Check if company matches (case-insensitive)
        if (config.companyName?.toLowerCase() === company.toLowerCase()) {
          // Use synthesis from config if available, otherwise use sample data
          const synthesisData = config.synthesis || sampleSynthesisV2;
          console.log('[Demo Mode] Found demo-config.json for:', company);
          console.log('[Demo Mode] Using:', config.synthesis ? 'config synthesis' : 'sample data');

          if (isMountedRef.current) {
            setState({
              companyName: company,
              synthesis: synthesisData,
              status: 'success',
              dataSource: 'demo-config',
              error: null,
              lastFetchedAt: new Date(),
              pollCount: 0,
              maxPolls: MAX_POLL_COUNT,
              isPolling: false,
              pipelineStage: 'complete',
              elapsedSeconds: 0,
            });
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[Demo Mode] demo-config.json fetch failed:', err);
    }

    // No matching company in demo-config - show no data state
    console.log('[Demo Mode] No matching company in demo-config for:', company);
    if (isMountedRef.current) {
      setState({
        companyName: company,
        synthesis: null,
        status: 'no-data',
        dataSource: 'none',
        error: `No report found for "${company}".`,
        lastFetchedAt: new Date(),
        pollCount: 0,
        maxPolls: MAX_POLL_COUNT,
        isPolling: false,
        pipelineStage: 'connecting',
        elapsedSeconds: 0,
      });

      // Optionally start polling if requested
      if (enablePollingOnFail) {
        startPolling();
      }
    }
  }, [fetchFromSupabase, startPolling]);

  // Manual check (single fetch, no polling)
  const manualCheck = useCallback(() => {
    if (companyParam) {
      fetchDemoData(companyParam, false);
    }
  }, [companyParam, fetchDemoData]);

  // Retry = manual check
  const retry = manualCheck;
  const refetch = manualCheck;

  // Initial fetch on mount
  useEffect(() => {
    if (!isDemoMode) {
      setState(prev => ({
        ...prev,
        status: 'idle',
        companyName: '',
        synthesis: null,
        error: null,
        isPolling: false,
      }));
      return;
    }

    if (companyParam) {
      fetchDemoData(companyParam, false);
    }

    return () => {
      stopPolling();
    };
  }, [companyParam, isDemoMode, fetchDemoData, stopPolling]);

  return {
    isDemoMode,
    isLoading: state.status === 'loading',
    ...state,
    retry,
    refetch,
    startPolling,
    stopPolling,
    manualCheck,
  };
}

/**
 * Get the demo company from URL params
 */
export function getDemoCompany(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('company');
}
