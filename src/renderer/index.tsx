import { createRoot } from 'react-dom/client';

import App from 'renderer/App';
import 'renderer/global.css';
import { preloadUiAssets } from 'UI/utils/preloadUiAssets';

preloadUiAssets();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
