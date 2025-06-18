import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";
import { localDB } from "./storage/indexedDB";
import { useTelegramData } from "./hooks/useTelegramData";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isReady, user } = useTelegramData();

  useEffect(() => {
    // Initialize storage and TON Connect
    const initApp = async () => {
      try {
        // Initialize IndexedDB for offline storage
        await localDB.init();
        console.log('IndexedDB initialized successfully');
        
        // Initialize TON Connect (don't wait for it to avoid blocking)
        import('./ton/connect').then(({ tonConnectManager }) => {
          tonConnectManager.init().catch(error => {
            console.warn('TON Connect initialization failed:', error);
          });
        });
        
      } catch (error) {
        console.warn('Failed to initialize app:', error);
      }
    };

    initApp();
  }, []);

  // Show loading while Telegram WebApp is initializing
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing SplitTON...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
