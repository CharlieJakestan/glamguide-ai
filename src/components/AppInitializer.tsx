import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        // Just do a minimal check - don't block the app
        console.log('App initializing...');
        
        if (mounted) {
          setIsInitialized(true);
          setInitError(null);
        }
      } catch (error) {
        console.warn('Initialization issue, continuing anyway:', error);
        
        if (mounted) {
          // Always continue - app should work regardless
          setIsInitialized(true);
          setInitError(null);
        }
      }
    };

    // Initialize immediately - no delays
    initializeApp();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-sm text-muted-foreground">Initializing app...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-destructive mb-2">Connection Issue</h2>
          <p className="text-muted-foreground mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;