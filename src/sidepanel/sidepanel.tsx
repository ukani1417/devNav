import { createRoot } from 'react-dom/client';
import { App } from '@/components/App';

// Find the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Could not find root element');
}

// Create React root and render app
const root = createRoot(container);
root.render(<App />);
