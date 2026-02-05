import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-red-100 dark:border-red-900/30 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Something went wrong</h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            The application encountered an unexpected error. You can try refreshing the page or resetting your local data if the problem persists.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Reload Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Reset App Data
                            </button>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 text-sm text-indigo-500 font-medium hover:underline mt-4"
                            >
                                <Home className="w-4 h-4" /> Back to Home
                            </a>
                        </div>
                        {process.env.NODE_ENV === 'development' && (
                            <pre className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-left text-xs overflow-auto max-h-40 text-red-500">
                                {this.state.error?.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
