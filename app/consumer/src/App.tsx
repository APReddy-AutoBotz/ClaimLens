import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSkeleton from './components/LoadingSkeleton';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

// Code splitting: lazy load routes
const Home = lazy(() => import('./pages/Home'));
const ScanHub = lazy(() => import('./pages/ScanHub'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route path="/" element={
            <RouteErrorBoundary fallbackTitle="Home is loading">
              <Home />
            </RouteErrorBoundary>
          } />
          <Route path="/scan" element={
            <RouteErrorBoundary fallbackTitle="Scanner is loading">
              <ScanHub />
            </RouteErrorBoundary>
          } />
          <Route path="/results" element={
            <RouteErrorBoundary fallbackTitle="Results are loading">
              <Results />
            </RouteErrorBoundary>
          } />
          <Route path="/history" element={
            <RouteErrorBoundary fallbackTitle="History is loading">
              <History />
            </RouteErrorBoundary>
          } />
          <Route path="/settings" element={
            <RouteErrorBoundary fallbackTitle="Settings are loading">
              <Settings />
            </RouteErrorBoundary>
          } />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
