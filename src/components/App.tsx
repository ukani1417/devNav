import { AppProvider } from '@/context/AppContext';
import { DevNavPanel } from './DevNavPanel';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-background text-foreground p-4">
        <DevNavPanel />
      </div>
      <Toaster />
    </AppProvider>
  );
}
