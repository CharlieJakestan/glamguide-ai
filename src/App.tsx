import React, { Suspense, lazy, Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Removed AppInitializer to prevent loading conflicts

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
    // Log the error for debugging but don't show error boundary unless it's truly critical
    console.error('Error caught by boundary:', error);
    
    // Don't show error boundary for any recoverable issues - let components handle their own errors
    if (error.message.includes('supabase') || 
        error.message.includes('auth') ||
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('camera') ||
        error.message.includes('mediaDevices') ||
        error.message.includes('getUserMedia') ||
        error.message.includes('Permission') ||
        error.message.includes('NotAllowedError') ||
        error.message.includes('NotFoundError') ||
        error.message.includes('ChunkLoadError') ||
        error.message.includes('face') ||
        error.message.includes('model') ||
        error.message.includes('detection') ||
        error.message.includes('lazy') ||
        error.message.includes('Suspense') ||
        error.message.includes('loading') ||
        error.message.includes('navigation') ||
        error.message.includes('router') ||
        error.name === 'ChunkLoadError' ||
        error.name === 'NotAllowedError' ||
        error.name === 'NotFoundError' ||
        error.name === 'PermissionDeniedError') {
      console.warn('Non-critical error, app continues normally:', error);
      return { hasError: false };
    }
    
    // Only show error boundary for truly critical React rendering errors that can't be recovered
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Details:', error, errorInfo);
    
    // Auto-recover immediately from any error - don't let users get stuck
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
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
                <Route path="/looks" element={<Looks />} />
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
    </AppErrorBoundary>
  );
};

export default App;