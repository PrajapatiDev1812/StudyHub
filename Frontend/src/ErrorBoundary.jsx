import React from 'react';
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '50px', background: '#fff', color: 'red', fontSize: '24px', zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh'}}>
          <h1>Application Crashed</h1>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
