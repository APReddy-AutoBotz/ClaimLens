# Test Updates Guide for B2C UI Upgrade

## Trust Score Tests to Update

### File: `packages/core/__tests__/trust-score.spec.ts`

Update all test expectations from 0-110 range to 0-100 range:

#### Changes to Make:

1. **Base Score**: 100 → 90
2. **Banned Claims Deduction**: 40 → 30 per claim
3. **Recall Deduction**: 30 → 25
4. **Allergen Deduction**: 20 → 15 per allergen
5. **Weasel Word Deduction**: 
   - High (>20%): 20 → 15
   - Medium (10-20%): 15 → 12
   - Low (5-10%): 10 → 8
6. **Clean Bonus**: 10 (unchanged)
7. **Max Score**: 110 → 100

#### Example Test Updates:

```typescript
// OLD
expect(result.score).toBe(110); // Clean product with bonus

// NEW
expect(result.score).toBe(100); // Clean product with bonus

// OLD
expect(result.score).toBe(60); // 100 - 40 (banned claim)

// NEW
expect(result.score).toBe(60); // 90 - 30 (banned claim)

// OLD
expect(result.score).toBe(0); // Multiple severe issues

// NEW
expect(result.score).toBe(0); // Multiple severe issues (clamped)
```

## Consumer Integration Tests

### File: `packages/transforms/__tests__/integration.consumer.spec.ts`

Update expected trust scores in integration tests:

```typescript
// Example: Update expected scores based on new algorithm
// OLD: expect(result.trust_score).toBe(70);
// NEW: expect(result.trust_score).toBe(65); // Recalculate based on new deductions
```

## Results Page Tests

### File: `app/consumer/src/pages/__tests__/Results.spec.tsx`

Add new tests for:

1. **Score Clamping**:
```typescript
it('should clamp trust score to 100 maximum', () => {
  const result = {
    trust_score: 150, // Over 100
    // ... other fields
  };
  
  render(<Results />);
  
  // Should display 100, not 150
  expect(screen.getByText('100')).toBeInTheDocument();
  expect(screen.getByText('/ 100')).toBeInTheDocument();
});

it('should clamp trust score to 0 minimum', () => {
  const result = {
    trust_score: -20, // Below 0
    // ... other fields
  };
  
  render(<Results />);
  
  // Should display 0, not -20
  expect(screen.getByText('0')).toBeInTheDocument();
});
```

2. **Receipts Drawer**:
```typescript
it('should render receipts drawer', () => {
  const result = {
    trust_score: 75,
    correlation_id: 'test-123',
    // ... other fields
  };
  
  render(<Results />);
  
  expect(screen.getByText('Receipts')).toBeInTheDocument();
  expect(screen.getByText('No tricks. Just proof.')).toBeInTheDocument();
});

it('should expand receipts drawer on click', async () => {
  render(<Results />);
  
  const trigger = screen.getByText('Receipts');
  await userEvent.click(trigger);
  
  expect(screen.getByText('Why this verdict?')).toBeInTheDocument();
});
```

3. **Updated Copy**:
```typescript
it('should show improved verdict copy for clean products', () => {
  const result = {
    trust_score: 100,
    badges: [],
    reasons: [],
    // ... other fields
  };
  
  render(<Results />);
  
  expect(screen.getByText(/No policy violations found/)).toBeInTheDocument();
  expect(screen.getByText(/Based on claim policy/)).toBeInTheDocument();
});
```

## Component Tests to Add

### File: `app/consumer/src/components/__tests__/ModeSwitch.spec.tsx` (NEW)

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSwitch } from '../ModeSwitch';

describe('ModeSwitch', () => {
  it('should render consumer and business tabs', () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    expect(screen.getByText('Consumer')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should call onModeChange when switching modes', async () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    await userEvent.click(screen.getByText('Business'));
    
    expect(onModeChange).toHaveBeenCalledWith('business');
  });

  it('should show active state for current mode', () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    const consumerTab = screen.getByText('Consumer').closest('button');
    expect(consumerTab).toHaveAttribute('aria-selected', 'true');
  });
});
```

### File: `app/consumer/src/components/__tests__/ProofStrip.spec.tsx` (NEW)

```typescript
import { render, screen } from '@testing-library/react';
import { ProofStrip } from '../ProofStrip';

describe('ProofStrip', () => {
  it('should render all check types', () => {
    render(<ProofStrip />);
    
    expect(screen.getByText('Claims')).toBeInTheDocument();
    expect(screen.getByText('Allergens')).toBeInTheDocument();
    expect(screen.getByText('PII')).toBeInTheDocument();
    expect(screen.getByText('Disclaimers')).toBeInTheDocument();
    expect(screen.getByText('Recalls')).toBeInTheDocument();
  });

  it('should render all output types', () => {
    render(<ProofStrip />);
    
    expect(screen.getByText('Allow')).toBeInTheDocument();
    expect(screen.getByText('Modify')).toBeInTheDocument();
    expect(screen.getByText('Avoid')).toBeInTheDocument();
    expect(screen.getByText('Explainability')).toBeInTheDocument();
  });
});
```

### File: `app/consumer/src/components/__tests__/ReceiptsDrawer.spec.tsx` (NEW)

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptsDrawer } from '../ReceiptsDrawer';

describe('ReceiptsDrawer', () => {
  it('should render trigger button', () => {
    render(<ReceiptsDrawer />);
    
    expect(screen.getByText('Receipts')).toBeInTheDocument();
    expect(screen.getByText('No tricks. Just proof.')).toBeInTheDocument();
  });

  it('should expand on click', async () => {
    render(<ReceiptsDrawer correlationId="test-123" checksRun={12} />);
    
    await userEvent.click(screen.getByText('Receipts'));
    
    expect(screen.getByText('Why this verdict?')).toBeInTheDocument();
    expect(screen.getByText('test-123')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should show empty state when no receipts', async () => {
    render(<ReceiptsDrawer receipts={[]} />);
    
    await userEvent.click(screen.getByText('Receipts'));
    
    expect(screen.getByText('No policy violations detected')).toBeInTheDocument();
  });

  it('should render receipts when provided', async () => {
    const receipts = [{
      ruleId: 'rule-1',
      ruleName: 'Banned Claim',
      packName: 'claims-pack',
      packVersion: '1.0.0',
      transformStep: 'detect.banned_claims',
      timestamp: new Date().toISOString(),
    }];
    
    render(<ReceiptsDrawer receipts={receipts} />);
    
    await userEvent.click(screen.getByText('Receipts'));
    
    expect(screen.getByText('Banned Claim')).toBeInTheDocument();
    expect(screen.getByText(/rule-1/)).toBeInTheDocument();
  });
});
```

## Snapshot Updates

If you have snapshot tests, update them:

```bash
npm test -- --updateSnapshot
```

## E2E Test Updates

### File: `e2e/consumer.e2e.spec.ts`

Update trust score expectations:

```typescript
// OLD
await expect(page.locator('[aria-label*="110"]')).toBeVisible();

// NEW
await expect(page.locator('[aria-label*="100"]')).toBeVisible();
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run specific test file:
```bash
npm test packages/core/__tests__/trust-score.spec.ts
```

### Run with coverage:
```bash
npm test -- --coverage
```

### Run in watch mode:
```bash
npm test -- --watch
```

## Checklist

- [ ] Update trust-score.spec.ts with new score ranges
- [ ] Update integration.consumer.spec.ts with new expected scores
- [ ] Add ModeSwitch component tests
- [ ] Add ProofStrip component tests
- [ ] Add ReceiptsDrawer component tests
- [ ] Update Results.spec.tsx with score clamping tests
- [ ] Update E2E tests with new score range
- [ ] Update snapshots if needed
- [ ] Verify all tests pass
- [ ] Check test coverage remains high (>80%)
