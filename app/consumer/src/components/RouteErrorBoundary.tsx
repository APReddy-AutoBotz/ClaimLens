import React, { Component, ReactNode } from 'react';
import styles from './RouteErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Route Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorCard}>
            <h2 className={styles.title}>
              {this.props.fallbackTitle || 'This view is loading demo data'}
            </h2>
            <div className={styles.content}>
              {this.state.error && (
                <p className={styles.errorMessage}>
                  {this.state.error.message}
                </p>
              )}
              <p className={styles.description}>
                This demo environment is still loading. Try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
