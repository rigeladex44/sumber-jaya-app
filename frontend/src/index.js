import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  handleReset = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'sans-serif',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
            Terjadi Kesalahan Aplikasi
          </h2>
          <p style={{ color: '#64748b', marginBottom: '20px', maxWidth: '400px' }}>
            Sesi browser atau data lokal mengalami pembaruan. Silakan muat ulang atau login kembali.
          </p>

          {this.state.error && (
            <pre style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              maxWidth: '90%',
              overflowX: 'auto',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              {this.state.error.toString()}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            Bersihkan Cache & Login Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);