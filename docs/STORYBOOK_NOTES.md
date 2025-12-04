# Storybook Notes — ClaimLens

## Overview

Storybook showcases ClaimLens UI components with interactive examples, accessibility checks, and design system documentation.

---

## 1. Setup

### Installation

```bash
# Install Storybook
pnpm add -D @storybook/react @storybook/react-vite @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-interactions @storybook/test

# Initialize
pnpm dlx storybook@latest init
```

### Configuration

```typescript
// .storybook/main.ts
import { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  }
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../app/web/design-tokens.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0B1220'
        },
        {
          name: 'light',
          value: '#F8FAFC'
        }
      ]
    }
  }
};

export default preview;
```

---

## 2. Component Stories

### Button Component

```typescript
// app/admin/src/components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    disabled: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button'
  }
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true
  }
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 0L10 6H16L11 10L13 16L8 12L3 16L5 10L0 6H6L8 0Z" fill="currentColor" />
        </svg>
        Button with Icon
      </>
    )
  }
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading...',
    disabled: true
  },
  play: async ({ canvasElement }) => {
    // Interaction test
    const button = canvasElement.querySelector('button');
    expect(button).toBeDisabled();
  }
};
```

---

### Badge Component

```typescript
// app/admin/src/components/Badge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Safe: Story = {
  args: {
    kind: 'safe',
    label: 'Safe',
    explanation: 'No issues detected'
  }
};

export const Caution: Story = {
  args: {
    kind: 'caution',
    label: 'Caution',
    explanation: 'Contains unverified health claims'
  }
};

export const Danger: Story = {
  args: {
    kind: 'danger',
    label: 'Blocked',
    explanation: 'Multiple banned claims detected'
  }
};

export const Allergen: Story = {
  args: {
    kind: 'allergen',
    label: 'Contains: Peanuts',
    explanation: 'This item contains peanuts which may cause allergic reactions'
  }
};

export const WithSource: Story = {
  args: {
    kind: 'caution',
    label: 'Claim Warning',
    explanation: 'Contains unverified health claims',
    source: 'https://fssai.gov.in/claims-guidelines'
  }
};
```

---

### KPI Card Component

```typescript
// app/admin/src/components/KPICard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { KPICard } from './KPICard';

const meta: Meta<typeof KPICard> = {
  title: 'Components/KPICard',
  component: KPICard,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof KPICard>;

export const TotalAudits: Story = {
  args: {
    label: 'Total Audits',
    value: '12,543',
    trend: {
      direction: 'up',
      value: '12%',
      period: 'from last month'
    }
  }
};

export const FlaggedItems: Story = {
  args: {
    label: 'Flagged Items',
    value: '1,234',
    trend: {
      direction: 'down',
      value: '8%',
      period: 'from last month'
    }
  }
};

export const AverageTime: Story = {
  args: {
    label: 'Average Processing Time',
    value: '145ms',
    trend: {
      direction: 'up',
      value: '5ms',
      period: 'from last week'
    }
  }
};

export const NoTrend: Story = {
  args: {
    label: 'Active Users',
    value: '523'
  }
};
```

---

### Modal Component

```typescript
// app/admin/src/components/Modal.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Modal Title"
        >
          <p>Modal content goes here.</p>
        </Modal>
      </>
    );
  }
};

export const WithFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
          footer={
            <>
              <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button onClick={() => setIsOpen(false)}>Confirm</button>
            </>
          }
        >
          <p>Are you sure you want to proceed?</p>
        </Modal>
      </>
    );
  }
};

export const AugmentLite: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Augment-Lite</button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Risky Policy Edit"
          size="large"
        >
          <div className="augment-lite-modal">
            <label>
              Context (What are you changing and why?)
              <textarea rows={3} placeholder="Minimum 20 characters..." />
            </label>
            
            <label>
              Constraints (What constraints must be maintained?)
              <textarea rows={3} placeholder="Minimum 20 characters..." />
            </label>
            
            <label>
              Self-Critique (What could go wrong?)
              <textarea rows={3} placeholder="Minimum 20 characters..." />
            </label>
            
            <label>
              <input type="checkbox" />
              I understand the risks
            </label>
            
            <label>
              Autonomy Level: <input type="range" min="0" max="5" />
            </label>
          </div>
        </Modal>
      </>
    );
  }
};
```

---

## 3. Design System Documentation

### Colors Story

```typescript
// app/admin/src/design-system/Colors.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Colors',
  tags: ['autodocs']
};

export default meta;

export const BaseColors = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <ColorSwatch name="Ink" value="#0B1220" />
    <ColorSwatch name="Surface" value="#0F1628" />
    <ColorSwatch name="Cloud" value="#F8FAFC" />
  </div>
);

export const BrandColors = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <ColorSwatch name="Indigo" value="#4F46E5" />
    <ColorSwatch name="Teal" value="#14B8A6" />
  </div>
);

export const SemanticColors = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <ColorSwatch name="Emerald (Safe)" value="#10B981" />
    <ColorSwatch name="Amber (Caution)" value="#F59E0B" />
    <ColorSwatch name="Red (Danger)" value="#EF4444" />
  </div>
);

export const AccentColors = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <ColorSwatch name="Mango" value="#FBBF24" />
    <ColorSwatch name="Leaf" value="#22C55E" />
    <ColorSwatch name="Berry" value="#8B5CF6" />
    <ColorSwatch name="Sky" value="#38BDF8" />
    <ColorSwatch name="Cream" value="#FEF9C3" />
  </div>
);

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div
        style={{
          width: '100px',
          height: '60px',
          backgroundColor: value,
          borderRadius: '8px',
          border: '1px solid rgba(248, 250, 252, 0.1)'
        }}
      />
      <div>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: '14px', opacity: 0.6 }}>{value}</div>
      </div>
    </div>
  );
}
```

---

### Typography Story

```typescript
// app/admin/src/design-system/Typography.stories.tsx
import type { Meta } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Typography',
  tags: ['autodocs']
};

export default meta;

export const FontSizes = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <div style={{ fontSize: 'var(--text-xs)' }}>Extra Small (12px)</div>
    <div style={{ fontSize: 'var(--text-sm)' }}>Small (14px)</div>
    <div style={{ fontSize: 'var(--text-base)' }}>Base (16px)</div>
    <div style={{ fontSize: 'var(--text-lg)' }}>Large (18px)</div>
    <div style={{ fontSize: 'var(--text-xl)' }}>Extra Large (20px)</div>
    <div style={{ fontSize: 'var(--text-2xl)' }}>2XL (24px)</div>
    <div style={{ fontSize: 'var(--text-3xl)' }}>3XL (30px)</div>
    <div style={{ fontSize: 'var(--text-4xl)' }}>4XL (36px)</div>
  </div>
);

export const FontWeights = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <div style={{ fontWeight: 'var(--font-normal)' }}>Normal (400)</div>
    <div style={{ fontWeight: 'var(--font-medium)' }}>Medium (500)</div>
    <div style={{ fontWeight: 'var(--font-semibold)' }}>Semibold (600)</div>
    <div style={{ fontWeight: 'var(--font-bold)' }}>Bold (700)</div>
  </div>
);
```

---

## 4. Accessibility Testing

### A11y Addon Configuration

```typescript
// .storybook/preview.ts
export const parameters = {
  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true
        },
        {
          id: 'label',
          enabled: true
        },
        {
          id: 'button-name',
          enabled: true
        }
      ]
    }
  }
};
```

### Accessibility Story

```typescript
// app/admin/src/components/Button.stories.tsx
export const AccessibilityTest: Story = {
  args: {
    variant: 'primary',
    children: 'Accessible Button'
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    
    // Check ARIA attributes
    expect(button).toHaveAttribute('type', 'button');
    
    // Check keyboard navigation
    button?.focus();
    expect(document.activeElement).toBe(button);
    
    // Check contrast ratio (handled by a11y addon)
  }
};
```

---

## 5. Interaction Testing

```typescript
// app/admin/src/components/Modal.stories.tsx
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Open modal
    const openButton = canvas.getByText('Open Modal');
    await userEvent.click(openButton);
    
    // Check modal is visible
    const modal = canvas.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // Close with ESC key
    await userEvent.keyboard('{Escape}');
    expect(modal).not.toBeInTheDocument();
    
    // Open again
    await userEvent.click(openButton);
    
    // Close with close button
    const closeButton = canvas.getByLabelText('Close');
    await userEvent.click(closeButton);
    expect(modal).not.toBeInTheDocument();
  }
};
```

---

## 6. Component Checklist

### Components to Document

#### Core Components
- [ ] Button (primary, secondary, danger, icon)
- [ ] Badge (safe, caution, danger, allergen)
- [ ] Input (text, number, email, password)
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Radio
- [ ] Toggle/Switch

#### Layout Components
- [ ] Container
- [ ] Grid
- [ ] Stack
- [ ] Spacer

#### Feedback Components
- [ ] Modal
- [ ] Toast/Notification
- [ ] Tooltip
- [ ] Spinner/Loader
- [ ] Progress Bar
- [ ] Skeleton

#### Data Display
- [ ] Table
- [ ] KPI Card
- [ ] Badge
- [ ] Avatar
- [ ] Empty State

#### Navigation
- [ ] Tabs
- [ ] Breadcrumbs
- [ ] Pagination
- [ ] Sidebar

#### Forms
- [ ] Form Group
- [ ] Form Label
- [ ] Form Error
- [ ] Form Helper Text

---

## 7. Running Storybook

### Development

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook

# Test Storybook
pnpm test-storybook
```

### Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "test-storybook"
  }
}
```

---

## 8. Deployment

### Static Hosting

```bash
# Build Storybook
pnpm build-storybook

# Deploy to Netlify/Vercel
# Upload storybook-static/ folder

# Or use Chromatic
pnpm chromatic --project-token=<token>
```

### GitHub Pages

```yaml
# .github/workflows/storybook.yml
name: Deploy Storybook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build-storybook
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

---

## 9. Best Practices

### Story Organization

```
app/
├── admin/
│   └── src/
│       ├── components/
│       │   ├── Button.tsx
│       │   ├── Button.stories.tsx
│       │   └── Button.test.tsx
│       └── design-system/
│           ├── Colors.stories.tsx
│           └── Typography.stories.tsx
```

### Story Naming

```typescript
// ✅ Good
export const Primary: Story = { ... };
export const WithIcon: Story = { ... };
export const Loading: Story = { ... };

// ❌ Bad
export const Story1: Story = { ... };
export const Test: Story = { ... };
```

### Documentation

```typescript
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button component with multiple variants and sizes.'
      }
    }
  }
};
```

---

## 10. References

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Interaction Testing](https://storybook.js.org/docs/react/writing-tests/interaction-testing)
- [Chromatic](https://www.chromatic.com/)
