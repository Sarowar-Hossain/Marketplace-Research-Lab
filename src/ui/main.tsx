import { createRoot } from 'react-dom/client';
import { App } from './app';
import './styles.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element "#root" was not found.');
}

createRoot(container).render(<App />);
