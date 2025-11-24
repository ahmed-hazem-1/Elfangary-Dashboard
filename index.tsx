import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log('Index.tsx loaded');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created, about to render');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Render called successfully');
} catch (error) {
  console.error('Error during React initialization:', error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
}