import { Component } from 'react';
import { Link } from 'react-router-dom';

// Last line of defence: if a page throws while rendering, show a calm message
// instead of a blank screen. Nothing about the error is shown to the user
// (no stack traces or internals); it is only written to the browser console.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Page failed to render:', error?.message);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="page" role="alert">
        <div className="empty">
          <h2>Something went wrong on this page</h2>
          <p>Please refresh and try again. If it keeps happening, make sure the API is up to date.</p>
          <p>
            <Link className="btn btn-secondary" to="/" onClick={() => this.setState({ failed: false })}>
              Back to home
            </Link>
          </p>
        </div>
      </section>
    );
  }
}
