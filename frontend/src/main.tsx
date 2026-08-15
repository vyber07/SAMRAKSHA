  import React from "react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./index.css";

  class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: any}> {
    constructor(props: {children: React.ReactNode}) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error: any) {
      return { error };
    }
    render() {
      if (this.state.error) {
        return <div style={{padding: '20px', color: 'red', background: 'white', zIndex: 9999, position: 'relative'}}><p>An unexpected error occurred. Please contact support.</p></div>;
      }
      return this.props.children;
    }
  }

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );