import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import ProfilesEditor from './pages/ProfilesEditor';
import RulePacksEditor from './pages/RulePacksEditor';
import FixturesRunner from './pages/FixturesRunner';
import AuditViewer from './pages/AuditViewer';
import ErrorBoundary from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import './design-tokens.css';
import './components.css';
import './accessibility.css';

function App() {
  useEffect(() => {
    // Track keyboard navigation for enhanced focus indicators
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav-active');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-nav-active');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <div className="layout">
        <nav className="nav" role="navigation" aria-label="Main navigation">
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>ClaimLens Admin</h2>
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            aria-label="Dashboard"
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/profiles" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            aria-label="Profiles & Routes"
          >
            Profiles & Routes
          </NavLink>
          <NavLink 
            to="/rule-packs" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            aria-label="Rule Packs"
          >
            Rule Packs
          </NavLink>
          <NavLink 
            to="/fixtures" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            aria-label="Fixtures Runner"
          >
            Fixtures Runner
          </NavLink>
        </nav>
        <main id="main-content" className="main-content" role="main" tabIndex={-1}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={
                <RouteErrorBoundary fallbackTitle="Dashboard is loading">
                  <Dashboard />
                </RouteErrorBoundary>
              } />
              <Route path="/profiles" element={
                <RouteErrorBoundary fallbackTitle="Profiles Editor is loading">
                  <ProfilesEditor />
                </RouteErrorBoundary>
              } />
              <Route path="/rule-packs" element={
                <RouteErrorBoundary fallbackTitle="Rule Packs Editor is loading">
                  <RulePacksEditor />
                </RouteErrorBoundary>
              } />
              <Route path="/fixtures" element={
                <RouteErrorBoundary fallbackTitle="Fixtures Runner is loading">
                  <FixturesRunner />
                </RouteErrorBoundary>
              } />
              <Route path="/audits/:id" element={
                <RouteErrorBoundary fallbackTitle="Audit Viewer is loading">
                  <AuditViewer />
                </RouteErrorBoundary>
              } />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
