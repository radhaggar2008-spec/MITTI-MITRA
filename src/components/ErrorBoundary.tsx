import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F0] text-[#2C1E18] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl bg-[#FFFFFF] border border-[#E8A5A1] p-6 sm:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-[#8D1E1E] font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Something went wrong</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#2C1E18]">
              Unable to load this section cleanly
            </h1>
            <p className="text-sm text-[#5C473D] leading-relaxed">
              {this.state.message.startsWith('{')
                ? 'A database permission or connection check interrupted the request. Please refresh or sign in again.'
                : this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
