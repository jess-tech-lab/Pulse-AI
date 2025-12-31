import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, type Profile, type Tenant } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isDemoMode: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for when Supabase isn't configured
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@threader.ai',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  email: 'demo@threader.ai',
  full_name: 'Demo User',
  tenant_id: 'demo-tenant',
  role: 'admin',
  created_at: new Date().toISOString(),
};

const DEMO_TENANT: Tenant = {
  id: 'demo-tenant',
  name: 'Demo Organization',
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    tenant: null,
    isLoading: true,
    isDemoMode: !isSupabaseConfigured,
  });

  useEffect(() => {
    // If Supabase isn't configured, we're in demo mode - skip auth check
    if (!isSupabaseConfigured || !supabase) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({ ...prev, user: session.user, session }));
        loadProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
      }));

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setState(prev => ({
          ...prev,
          profile: null,
          tenant: null,
          isLoading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    if (!supabase) return;

    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Load tenant info
      let tenant: Tenant | null = null;
      if (profile?.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single();
        tenant = tenantData;
      }

      setState(prev => ({
        ...prev,
        profile,
        tenant,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setState({
      user: null,
      session: null,
      profile: null,
      tenant: null,
      isLoading: false,
      isDemoMode: !isSupabaseConfigured,
    });
  };

  const refreshProfile = async () => {
    if (state.user && supabase) {
      await loadProfile(state.user.id);
    }
  };

  const enterDemoMode = () => {
    setState({
      user: DEMO_USER,
      session: null,
      profile: DEMO_PROFILE,
      tenant: DEMO_TENANT,
      isLoading: false,
      isDemoMode: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
