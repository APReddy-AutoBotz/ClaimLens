import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SpectralScan, type ScanStep } from '../SpectralScan';

describe('SpectralScan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSteps: ScanStep[] = [
    {
      id: 'step1',
      label: 'Allergen Detection',
      status: 'scanning',
      evidence: 'Found: peanuts',
    },
    {
      id: 'step2',
      label: 'Banned Claims Check',
      status: 'clear',
      evidence: 'No banned claims found',
    },
  ];

  it('should not render when not active', () => {
    const { container } = render(
      <SpectralScan steps={mockSteps} isActive={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render header when active', () => {
    render(<SpectralScan steps={mockSteps} isActive={true} />);
    expect(screen.getByText('Forensic Analysis')).toBeInTheDocument();
  });

  it('should progressively reveal steps', async () => {
    render(<SpectralScan steps={mockSteps} isActive={true} />);
    
    // Initially no steps visible
    expect(screen.queryByText('Allergen Detection')).not.toBeInTheDocument();
    
    // Advance timers to reveal first step
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(screen.getByText('Allergen Detection')).toBeInTheDocument();
    });
    
    // Second step not yet visible
    expect(screen.queryByText('Banned Claims Check')).not.toBeInTheDocument();
    
    // Advance to reveal second step
    vi.advanceTimersByTime(450);
    await waitFor(() => {
      expect(screen.getByText('Banned Claims Check')).toBeInTheDocument();
    });
  });

  it('should call onComplete when all steps are shown', async () => {
    const onComplete = vi.fn();
    render(
      <SpectralScan steps={mockSteps} isActive={true} onComplete={onComplete} />
    );
    
    // Advance through all steps
    vi.advanceTimersByTime(300); // Initial delay
    vi.advanceTimersByTime(450); // Step 1
    vi.advanceTimersByTime(450); // Step 2
    vi.advanceTimersByTime(300); // Complete callback delay
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should show evidence for completed steps', async () => {
    render(<SpectralScan steps={mockSteps} isActive={true} />);
    
    // Advance to show first step
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(screen.getByText('Allergen Detection')).toBeInTheDocument();
    });
    
    // Advance to complete first step
    vi.advanceTimersByTime(450);
    await waitFor(() => {
      expect(screen.getByText('Found: peanuts')).toBeInTheDocument();
    });
  });

  it('should show status icons based on step status', async () => {
    const stepsWithDifferentStatuses: ScanStep[] = [
      { id: '1', label: 'Step 1', status: 'found', evidence: 'Issue' },
      { id: '2', label: 'Step 2', status: 'clear', evidence: 'OK' },
      { id: '3', label: 'Step 3', status: 'skipped', evidence: 'Skipped' },
    ];
    
    render(<SpectralScan steps={stepsWithDifferentStatuses} isActive={true} />);
    
    // Advance through all steps
    vi.advanceTimersByTime(300);
    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(450);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Issue found')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear')).toBeInTheDocument();
      expect(screen.getByLabelText('Skipped')).toBeInTheDocument();
    });
  });
});
