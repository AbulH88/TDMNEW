import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// our pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ApiCall from "./pages/ApiCall";
import ServiceCall from "./pages/ServiceCall";
import HelpWidget from "./components/HelpWidget";
import Tests from "./pages/Tests";

// create a client for react-query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ServiceCall />} />
            <Route path="/api-call" element={<ApiCall />} />
            <Route path="/service-call" element={<ServiceCall />} />
            <Route path="/generator" element={<Index />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/tests" element={<Tests />} />
          </Routes>
          <HelpWidget />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;