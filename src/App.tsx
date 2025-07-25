import React, { Suspense, lazy, Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
    console.error('Error caught by error boundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
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
    </AppErrorBoundary>
  );
};

export default App;