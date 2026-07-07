import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Something went wrong.</h1>
          <p style={{ marginBottom: '20px' }}>The application crashed due to an unexpected error.</p>
          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', overflow: 'auto', maxWidth: '800px', width: '100%', border: '1px solid #f5c6cb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Error Details:</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px', marginBottom: '10px' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Component Stack:</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
