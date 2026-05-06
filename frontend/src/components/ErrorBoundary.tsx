import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-surface rounded-lg border border-border">
                    <div className="bg-danger/10 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
                    <p className="text-text-secondary mb-6 max-w-md">
                        An unexpected error occurred. Please try reloading the page. If the issue persists, contact support.
                    </p>
                    {/* BUG-005 fix: Never show raw error messages to users — they can leak internal
                        architecture, Supabase errors, or stack traces. Wrap in a details element
                        so only developers who actively expand it can see the technical message. */}
                    {import.meta.env.DEV && this.state.error && (
                        <details className="mb-6 text-left w-full max-w-lg">
                            <summary className="text-xs text-danger font-mono cursor-pointer mb-1 select-none">
                                [DEV] Error details (hidden in production)
                            </summary>
                            <div className="p-3 bg-background rounded overflow-auto max-h-32 mt-1">
                                <p className="text-xs text-danger font-mono whitespace-pre-wrap">
                                    {this.state.error.message}
                                </p>
                            </div>
                        </details>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
