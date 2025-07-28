import React, { Suspense, lazy, Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppInitializer from "@/components/AppInitializer";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Camera = lazy(() => import("./pages/Camera"));
const Looks = lazy(() => import("./pages/Looks"));
const Auth = lazy(() => import("./pages/Auth"));
const GanGenerator = lazy(() => import("./pages/GanGenerator"));
const GanGeneratorAdvanced = lazy(() => import("./pages/GanGeneratorAdvanced"));
const NotFound = lazy(() => import("./pages/NotFound"));
const KnowledgeManagement = lazy(() => import("./pages/KnowledgeManagement"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Handle specific errors that shouldn't trigger error boundary
    if (error.message.includes('supabase') || 
        error.message.includes('auth') ||
        error.message.includes('network') ||
        error.message.includes('fetch')) {
      console.warn('Non-critical error caught:', error);
      return { hasError: false };
    }
    
    console.error('Critical error caught by error boundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
    
    // Auto-recover from certain types of errors
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 3000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Loading Issue</h1>
            <p className="text-muted-foreground mb-4">
              The app is initializing. This will auto-recover in a moment.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <AppErrorBoundary>
      <AppInitializer>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/camera" element={<Camera />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/looks" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute>
                        <Looks />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/gan-generator" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute>
                        <GanGenerator />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/gan-generator-advanced" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute>
                        <GanGeneratorAdvanced />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="/knowledge" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProtectedRoute>
                        <KnowledgeManagement />
                      </ProtectedRoute>
                    </Suspense>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
          </TooltipProvider>
        </QueryClientProvider>
      </AppInitializer>
    </AppErrorBoundary>
  );
};

export default App;