import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 glass-panel text-gray-300">
          <p className="text-sm text-red-400 mb-2">
            Something went wrong{this.props.name ? ` in ${this.props.name}` : ''}.
          </p>
          <p className="text-xs text-gray-500 mb-3 max-w-md text-center break-all">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-pro px-3 py-1.5 text-xs bg-accent-primary text-black rounded-lg hover:bg-emerald-400"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
