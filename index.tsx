import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (!container) {
    console.error("Critical: Could not find root element to mount the application.");
} else {
    try {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    } catch (err) {
        console.error("Failed to render the application:", err);
        container.innerHTML = `<div style="color: red; padding: 20px;">Failed to load application. See console for details.</div>`;
    }
}