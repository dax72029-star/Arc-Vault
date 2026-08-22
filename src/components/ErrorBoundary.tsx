import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-vault-error-subtle flex items-center justify-center mb-6">
            <AlertTriangle className="w-7 h-7 text-vault-error" />
          </div>
          <h2 className="text-xl font-display font-bold text-vault-text mb-2">Something went wrong</h2>
          <p className="text-sm text-vault-muted max-w-md mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="vault-btn-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
