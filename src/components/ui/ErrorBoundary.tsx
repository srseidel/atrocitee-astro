import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/astro';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-bold text-red-800">Something went wrong</h2>
          <p className="text-red-700">
            An error occurred while rendering this component. Please try refreshing the page.
          </p>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 p-2 bg-red-100 rounded text-sm overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 