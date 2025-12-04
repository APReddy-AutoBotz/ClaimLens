# Testing Guide - ClaimLens Admin Console

This document describes the testing strategy and how to run tests for the Admin Console frontend.

## Test Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **Assertions**: @testing-library/jest-dom matchers
- **Coverage**: v8 (built into Vitest)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test Dashboard.spec.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep "accessibility"
```

## Test Coverage Requirements

The project enforces minimum coverage thresholds:
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Coverage reports are generated in `coverage/` directory.

## Test Structure

### Unit Tests

Located in `src/__tests__/` directory:

- `Dashboard.spec.tsx` - Dashboard page tests
- `AuditViewer.spec.tsx` - Audit viewer page tests
- `AugmentLiteModal.spec.tsx` - Modal component tests
- `accessibility.spec.tsx` - Accessibility feature tests

### Test Categories

#### 1. Component Rendering Tests
```typescript
it('renders dashboard metrics after loading', async () => {
  vi.mocked(api.getDashboard).mockResolvedValue(mockMetrics);
  render(<BrowserRouter><Dashboard /></BrowserRouter>);
  
  await waitFor(() => {
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });
});
```

#### 2. User Interaction Tests
```typescript
it('calls onSave with valid data', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  
  render(<AugmentLiteModal isOpen={true} onSave={onSave} />);
  
  await user.type(screen.getByLabelText(/Context:/i), 'Valid context');
  await user.click(screen.getByRole('button', { name: /Save/i }));
  
  expect(onSave).toHaveBeenCalled();
});
```

#### 3. Accessibility Tests
```typescript
it('has proper ARIA attributes', () => {
  render(<AugmentLiteModal isOpen={true} />);
  
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
});
```

#### 4. Error Handling Tests
```typescript
it('displays error message on API failure', async () => {
  vi.mocked(api.getDashboard).mockRejectedValue(new Error('Network error'));
  
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
  });
});
```

## Testing Best Practices

### 1. Use Semantic Queries

Prefer queries that reflect how users interact with the app:

```typescript
// ✅ Good - semantic query
screen.getByRole('button', { name: /Save Changes/i })

// ❌ Avoid - implementation detail
screen.getByTestId('save-button')
```

### 2. Test User Behavior, Not Implementation

```typescript
// ✅ Good - tests user behavior
it('closes modal on ESC key', async () => {
  const onClose = vi.fn();
  render(<Modal isOpen={true} onClose={onClose} />);
  
  fireEvent.keyDown(document, { key: 'Escape' });
  
  expect(onClose).toHaveBeenCalled();
});

// ❌ Avoid - tests implementation
it('sets isOpen state to false', () => {
  // Testing internal state
});
```

### 3. Use waitFor for Async Operations

```typescript
// ✅ Good - waits for async operation
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ❌ Avoid - may cause flaky tests
expect(screen.getByText('Loaded')).toBeInTheDocument();
```

### 4. Mock External Dependencies

```typescript
vi.mock('../api');

beforeEach(() => {
  vi.mocked(api.getDashboard).mockResolvedValue(mockData);
});
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks();
  cleanup(); // Handled automatically by setup.ts
});
```

## Accessibility Testing

### Keyboard Navigation
```typescript
it('supports Tab navigation', async () => {
  const user = userEvent.setup();
  render(<App />);
  
  await user.tab();
  expect(screen.getByText('Skip to main content')).toHaveFocus();
});
```

### ARIA Attributes
```typescript
it('has proper ARIA labels', () => {
  render(<Dashboard />);
  
  const nav = screen.getByRole('navigation');
  expect(nav).toHaveAttribute('aria-label', 'Main navigation');
});
```

### Screen Reader Support
```typescript
it('announces status messages', async () => {
  render(<Dashboard />);
  
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('System Operating in Degraded Mode');
});
```

## Mocking Strategies

### API Calls
```typescript
vi.mock('../api');

vi.mocked(api.getDashboard).mockResolvedValue(mockData);
vi.mocked(api.getDashboard).mockRejectedValue(new Error('Failed'));
```

### Timers
```typescript
vi.useFakeTimers();

// Advance time
vi.advanceTimersByTime(30000);

vi.useRealTimers();
```

### Browser APIs
```typescript
// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
```

## Common Testing Patterns

### Testing Forms
```typescript
it('validates form fields', async () => {
  const user = userEvent.setup();
  render(<Form />);
  
  const input = screen.getByLabelText(/Email/i);
  await user.type(input, 'invalid-email');
  
  await user.click(screen.getByRole('button', { name: /Submit/i }));
  
  expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
});
```

### Testing Modals
```typescript
it('closes modal on overlay click', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  
  render(<Modal isOpen={true} onClose={onClose} />);
  
  const overlay = screen.getByRole('dialog').parentElement;
  await user.click(overlay);
  
  expect(onClose).toHaveBeenCalled();
});
```

### Testing Tables
```typescript
it('renders table data', async () => {
  render(<DataTable data={mockData} />);
  
  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();
  
  const rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(mockData.length + 1); // +1 for header
});
```

### Testing Auto-Refresh
```typescript
it('auto-refreshes every 30 seconds', async () => {
  vi.useFakeTimers();
  vi.mocked(api.getDashboard).mockResolvedValue(mockData);
  
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(api.getDashboard).toHaveBeenCalledTimes(1);
  });
  
  vi.advanceTimersByTime(30000);
  
  await waitFor(() => {
    expect(api.getDashboard).toHaveBeenCalledTimes(2);
  });
  
  vi.useRealTimers();
});
```

## Debugging Tests

### View Rendered Output
```typescript
import { screen } from '@testing-library/react';

// Print entire DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Check Available Queries
```typescript
// See all available roles
screen.logTestingPlaygroundURL();
```

### Run Single Test
```bash
npm test -- --grep "specific test name"
```

### Run Tests in UI Mode
```bash
npm test -- --ui
```

## Continuous Integration

Tests run automatically on:
- Pre-commit (via git hooks)
- Pull requests (via GitHub Actions)
- Pre-push (via git hooks)

CI will fail if:
- Any test fails
- Coverage drops below 80%
- Linting errors exist

## Performance Testing

While not included in unit tests, performance can be measured:

```typescript
it('renders within performance budget', async () => {
  const start = performance.now();
  
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100); // 100ms budget
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Troubleshooting

### Tests Timing Out
- Increase timeout: `it('test', async () => {}, 10000)`
- Check for missing `await` on async operations
- Verify mocks are returning resolved promises

### Element Not Found
- Use `screen.debug()` to see rendered output
- Check if element is rendered conditionally
- Verify query selector is correct

### Flaky Tests
- Use `waitFor` for async operations
- Avoid testing implementation details
- Clean up timers and mocks properly

---

**Last Updated:** November 2, 2025
