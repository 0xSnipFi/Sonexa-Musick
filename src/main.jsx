import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './app.css';

// Catches any render crash so the app degrades to a readable message + reload
// instead of a frozen, unresponsive screen.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28,
          background: '#06040c', color: '#f5f2fc', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Something glitched</div>
          <div style={{ fontSize: 14, opacity: 0.7, maxWidth: 320 }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button onClick={() => { try { location.reload(); } catch { /* noop */ } }}
            style={{ marginTop: 8, padding: '12px 22px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#6e56ff,#c15cff)', color: '#fff',
              fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log('--- STARTING APP INITIALIZATION ---');
try {
  const root = document.getElementById('root');
  if (!root) {
    console.error('ROOT ELEMENT NOT FOUND');
  } else {
    console.log('Root element found, calling ReactDOM.render');
    ReactDOM.createRoot(root).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log('ReactDOM.render returned');
  }
} catch (e) {
  console.error('CRITICAL INITIALIZATION ERROR:', e);
}
