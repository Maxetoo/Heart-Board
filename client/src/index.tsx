import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Suppress only crypto-wallet extension noise. Narrow on purpose: the original
// AI Studio version also swallowed anything containing "ethereum", which hides
// real application errors.
if (typeof window !== 'undefined') {
  const isExtensionError = (msg?: string | null) => {
    if (!msg) return false;
    const lower = String(msg).toLowerCase();
    return (
      lower.includes('metamask') ||
      lower.includes('chrome-extension://') ||
      lower.includes('moz-extension://')
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isExtensionError(event.message) || isExtensionError(event.filename)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    },
    true,
  );

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string } | undefined;
    const message = reason?.message || String(reason || '');
    if (isExtensionError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('App captured error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-[#ECEFF3]">
            <div className="w-12 h-12 rounded-full bg-[#FE6349]/10 text-[#FE6349] flex items-center justify-center mx-auto mb-4 text-2xl">
              💛
            </div>
            <h2 className="text-xl font-extrabold text-[#1A1B25] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#666D80] mb-6">
              We encountered a temporary issue while loading the application.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-[#FE6349] hover:bg-[#e05234] text-white font-bold rounded-full text-sm shadow-xs transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

