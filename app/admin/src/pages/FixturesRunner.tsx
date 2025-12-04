import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Fixture, FixtureResult } from '../types';

function FixturesRunner() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixtures, setSelectedFixtures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<FixtureResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    try {
      setLoading(true);
      const data = await api.getFixtures();
      // Ensure data is an array
      setFixtures(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  const toggleFixture = (fixtureName: string) => {
    const newSelected = new Set(selectedFixtures);
    if (newSelected.has(fixtureName)) {
      newSelected.delete(fixtureName);
    } else {
      newSelected.add(fixtureName);
    }
    setSelectedFixtures(newSelected);
  };

  const toggleAll = () => {
    if (selectedFixtures.size === fixtures.length) {
      setSelectedFixtures(new Set());
    } else {
      setSelectedFixtures(new Set(fixtures.map(f => f.name)));
    }
  };

  const runSelected = async () => {
    if (selectedFixtures.size === 0) return;

    setRunning(true);
    setProgress(0);
    setResults(null);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const fixtureNames = Array.from(selectedFixtures);
      const data = await api.runFixtures(fixtureNames);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run fixtures');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div>Loading fixtures...</div>;
  }

  if (error && !results) {
    return <div style={{ color: 'var(--cl-danger)' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Fixtures Runner</h1>

      <div className="card mt-4">
        <div className="flex" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Available Fixtures</h3>
          <button
            className="btn btn-ghost"
            onClick={toggleAll}
            aria-label={selectedFixtures.size === fixtures.length ? 'Deselect all fixtures' : 'Select all fixtures'}
          >
            {selectedFixtures.size === fixtures.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="checkbox-group">
          {fixtures.map(fixture => (
            <label key={fixture.name} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedFixtures.has(fixture.name)}
                onChange={() => toggleFixture(fixture.name)}
                aria-label={`Select fixture ${fixture.name}`}
              />
              <span>
                {fixture.name}
                <span style={{ color: '#C7D2FE', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                  ({fixture.type})
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-3">
          <button
            className="btn btn-primary"
            onClick={runSelected}
            disabled={selectedFixtures.size === 0 || running}
            aria-label="Run selected fixtures"
          >
            {running ? 'Running...' : `Run Selected (${selectedFixtures.size})`}
          </button>
        </div>

        {running && (
          <div className="mt-3">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#C7D2FE' }}>
              {progress}% complete
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="mt-4">
          <h2>Results</h2>

          {/* Summary Metrics */}
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi">
              <h4>Total Flags</h4>
              <div className="num">{results.reduce((sum, r) => sum + r.flags, 0)}</div>
            </div>
            <div className="kpi">
              <h4>Total Warnings</h4>
              <div className="num">{results.reduce((sum, r) => sum + r.warnings, 0)}</div>
            </div>
            <div className="kpi">
              <h4>Total Errors</h4>
              <div className="num">{results.reduce((sum, r) => sum + r.errors, 0)}</div>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="card mt-3">
            <h3>Detailed Results</h3>
            <table className="table results-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Fixture</th>
                  <th scope="col">Flags</th>
                  <th scope="col">Warnings</th>
                  <th scope="col">Errors</th>
                  <th scope="col">p50 Latency</th>
                  <th scope="col">p95 Latency</th>
                  <th scope="col">Audit Pack</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.fixture}>
                    <td>{result.fixture}</td>
                    <td>
                      <span className={result.flags > 0 ? 'badge-warn cl-badge' : ''}>
                        {result.flags}
                      </span>
                    </td>
                    <td>
                      <span className={result.warnings > 0 ? 'badge-warn cl-badge' : ''}>
                        {result.warnings}
                      </span>
                    </td>
                    <td>
                      <span className={result.errors > 0 ? 'badge-danger cl-badge' : ''}>
                        {result.errors}
                      </span>
                    </td>
                    <td>{result.p50_latency.toFixed(1)}ms</td>
                    <td>{result.p95_latency.toFixed(1)}ms</td>
                    <td>
                      {result.audit_pack_url && (
                        <a 
                          href={result.audit_pack_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label={`Download audit pack for ${result.fixture}`}
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Metrics */}
          <div className="card mt-3">
            <h3>Performance Metrics</h3>
            <div className="metric-row">
              <span>Average p50 Latency</span>
              <span>
                {(results.reduce((sum, r) => sum + r.p50_latency, 0) / results.length).toFixed(1)}ms
              </span>
            </div>
            <div className="metric-row">
              <span>Average p95 Latency</span>
              <span>
                {(results.reduce((sum, r) => sum + r.p95_latency, 0) / results.length).toFixed(1)}ms
              </span>
            </div>
            <div className="metric-row">
              <span>Max p95 Latency</span>
              <span>
                {Math.max(...results.map(r => r.p95_latency)).toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FixturesRunner;
