
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Camera from "./pages/Camera";
import Looks from "./pages/Looks";
import Auth from "./pages/Auth";
import GanGenerator from "./pages/GanGenerator";
import GanGeneratorAdvanced from "./pages/GanGeneratorAdvanced";
import NotFound from "./pages/NotFound";
import KnowledgeManagement from './pages/KnowledgeManagement';
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/looks" element={
              <ProtectedRoute>
                <Looks />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/gan-generator" element={
              <ProtectedRoute>
                <GanGenerator />
              </ProtectedRoute>
            } />
            <Route path="/gan-generator-advanced" element={
              <ProtectedRoute>
                <GanGeneratorAdvanced />
              </ProtectedRoute>
            } />
            <Route path="/knowledge" element={
              <ProtectedRoute>
                <KnowledgeManagement />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
