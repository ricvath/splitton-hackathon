import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { HackathonDemo } from "./components/HackathonDemo";

const queryClient = new QueryClient();

// TON Connect manifest URL
const manifestUrl = 'https://splitton-hackathon.netlify.app/tonconnect-manifest.json';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HackathonDemo />} />
            <Route path="/original" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<HackathonDemo />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TonConnectUIProvider>
  </QueryClientProvider>
);

export default App;
