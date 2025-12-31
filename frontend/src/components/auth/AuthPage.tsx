import { useState } from 'react';
import { Activity, Play } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function AuthPage() {
  const { enterDemoMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // If Supabase isn't configured, show demo mode option
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
                <Activity className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome to Threader AI</CardTitle>
            <CardDescription>
              AI-Powered Product Feedback Intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-2">Demo Mode</p>
              <p className="text-muted-foreground">
                Supabase is not configured. Click below to explore the dashboard with sample data.
              </p>
            </div>

            <Button onClick={enterDemoMode} className="w-full" size="lg">
              <Play className="w-5 h-5" />
              Enter Demo Mode
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>To enable authentication, add your Supabase credentials to <code>.env</code>:</p>
              <pre className="mt-2 p-2 bg-muted rounded text-left overflow-x-auto">
{`VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'signup') {
    return <SignupForm onSwitchToLogin={() => setMode('login')} />;
  }

  return <LoginForm onSwitchToSignup={() => setMode('signup')} />;
}
