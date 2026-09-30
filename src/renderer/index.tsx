import { createRoot } from 'react-dom/client';

import { preloadUiAssets } from 'UI/utils/preloadUiAssets';

import './global.css';
import App from './App';

preloadUiAssets();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
