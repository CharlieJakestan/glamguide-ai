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
import NotFound from "./pages/NotFound";
import KnowledgeManagement from './pages/KnowledgeManagement';

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
            <Route path="/looks" element={<Looks />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/gan-generator" element={<GanGenerator />} />
            <Route path="/knowledge" element={<KnowledgeManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
