import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { HackathonDemo } from './components/HackathonDemo';
import './App.css';

const queryClient = new QueryClient();

// TON Connect manifest URL
// For production Telegram bot, we'll use the deployed URL
// For local development, we'll use localhost
const isProduction = window.location.hostname !== 'localhost';
const manifestUrl = isProduction 
  ? 'https://splitton-hackathon.netlify.app/tonconnect-manifest.json'
  : 'http://localhost:8080/tonconnect-manifest.json';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <HackathonDemo />
    </TonConnectUIProvider>
  </QueryClientProvider>
);

export default App;
