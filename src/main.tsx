import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import test utilities for development
//if (import.meta.env.MODE === 'development') {
//  import('./lib/imageApiTests');
//}
//

createRoot(document.getElementById("root")!).render(<App />);
