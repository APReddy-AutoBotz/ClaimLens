import { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ 
              color: 'var(--cl-danger)', 
              marginTop: 0,
              background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Something went wrong
            </h2>
            <p style={{ 
              color: '#C7D2FE', 
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              {this.state.error?.message || 'An unexpected error occurred. Please try reloading the page or return to the dashboard.'}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link 
                to="/" 
                className="btn btn-primary" 
                onClick={this.handleReset}
                aria-label="Return to Dashboard"
              >
                Return to Dashboard
              </Link>
              <button 
                className="btn btn-ghost" 
                onClick={this.handleReload}
                aria-label="Reload Page"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
