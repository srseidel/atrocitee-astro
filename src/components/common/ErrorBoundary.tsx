import * as Sentry from '@sentry/astro';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { debug } from '@lib/utils/debug';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    debug.criticalError('React component error boundary triggered', error, { 
      componentStack: errorInfo.componentStack,
      errorBoundary: true 
    });
    
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-bold text-red-800">Something went wrong</h2>
          <p className="text-red-700">
            An error occurred while rendering this component. Please try refreshing the page.
          </p>
          {this.state.error && import.meta.env.DEV && (
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