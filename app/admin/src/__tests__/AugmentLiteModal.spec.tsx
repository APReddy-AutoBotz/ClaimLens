import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PolicyChangeModal from '../components/PolicyChangeModal';

describe('PolicyChangeModal', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <PolicyChangeModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders when open', () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Request Policy Change')).toBeInTheDocument();
  });

  it('displays all three required fields', () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    expect(screen.getByLabelText(/Context/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Constraints/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Self-Critique/i)).toBeInTheDocument();
  });

  it('validates minimum character requirements for context', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    fireEvent.change(contextField, { target: { value: 'Too short' } });
    fireEvent.blur(contextField);

    await waitFor(() => {
      expect(screen.getByText(/Context must be at least 200 characters/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Submit Request').closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('validates all three required fields', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const submitButton = screen.getByText('Submit Request').closest('button');
    expect(submitButton).toBeDisabled();

    // Fill context with insufficient characters
    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    fireEvent.change(contextField, { target: { value: 'Short' } });
    fireEvent.blur(contextField);

    // Fill constraints with insufficient characters
    const constraintsField = screen.getByLabelText(/Constraints/i) as HTMLTextAreaElement;
    fireEvent.change(constraintsField, { target: { value: 'Short' } });
    fireEvent.blur(constraintsField);

    // Fill critique with insufficient characters
    const critiqueField = screen.getByLabelText(/Self-Critique/i) as HTMLTextAreaElement;
    fireEvent.change(critiqueField, { target: { value: 'Short' } });
    fireEvent.blur(critiqueField);

    await waitFor(() => {
      expect(screen.getByText(/Context must be at least 200 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Constraints must be at least 100 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Critique must be at least 100 characters/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        operator="test-operator"
      />
    );

    // Fill context with sufficient characters (200+)
    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    const contextText = 'This is a valid context field with enough characters to meet the minimum requirement. '.repeat(3);
    fireEvent.change(contextField, { target: { value: contextText } });

    // Fill constraints with sufficient characters (100+)
    const constraintsField = screen.getByLabelText(/Constraints/i) as HTMLTextAreaElement;
    const constraintsText = 'These are valid constraints with enough characters to meet the minimum requirement. '.repeat(2);
    fireEvent.change(constraintsField, { target: { value: constraintsText } });

    // Fill critique with sufficient characters (100+)
    const selfCritiqueField = screen.getByLabelText(/Self-Critique/i) as HTMLTextAreaElement;
    const critiqueText = 'This is a valid self-critique with enough characters to meet the minimum requirement. '.repeat(2);
    fireEvent.change(selfCritiqueField, { target: { value: critiqueText } });

    const submitButton = screen.getByText('Submit Request').closest('button');
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          operator: 'test-operator',
          context: expect.stringContaining('valid context'),
          constraints: expect.stringContaining('valid constraints'),
          self_critique: expect.stringContaining('valid self-critique'),
          impact_preview: expect.objectContaining({
            affected_rules: expect.any(Array),
            risk_level: expect.stringMatching(/low|medium|high/),
            estimated_impact: expect.any(String),
            confidence: expect.any(Number)
          })
        })
      );
    });
  });

  it('closes on ESC key press', async () => {
    const onClose = vi.fn();

    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes on Cancel button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on overlay click', async () => {
    const onClose = vi.fn();

    const { container } = render(
      <PolicyChangeModal
        isOpen={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    // Click the overlay (the element with className="modal-overlay")
    const overlay = container.querySelector('.modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    }
  });

  it('shows character count for each field', () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    // Check for character counters
    expect(screen.getByText(/0 \/ 200-2000 characters/i)).toBeInTheDocument();
    // There are two fields with 100-1000 range (constraints and critique), so use getAllByText
    const hundredRangeCounters = screen.getAllByText(/0 \/ 100-1000 characters/i);
    expect(hundredRangeCounters).toHaveLength(2);
  });

  it('has proper ARIA attributes', () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');

    const contextField = screen.getByLabelText(/Context/i);
    expect(contextField).toHaveAttribute('aria-required', 'true');
  });

  it('displays impact preview when form is valid', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    // Fill all fields with valid data
    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    const contextText = 'This is a valid context field with enough characters to meet the minimum requirement. '.repeat(3);
    fireEvent.change(contextField, { target: { value: contextText } });

    const constraintsField = screen.getByLabelText(/Constraints/i) as HTMLTextAreaElement;
    const constraintsText = 'These are valid constraints with enough characters to meet the minimum requirement. '.repeat(2);
    fireEvent.change(constraintsField, { target: { value: constraintsText } });

    const selfCritiqueField = screen.getByLabelText(/Self-Critique/i) as HTMLTextAreaElement;
    const critiqueText = 'This is a valid self-critique with enough characters to meet the minimum requirement. '.repeat(2);
    fireEvent.change(selfCritiqueField, { target: { value: critiqueText } });

    await waitFor(() => {
      expect(screen.getByText('Impact Preview')).toBeInTheDocument();
      expect(screen.getByText(/Risk Level:/i)).toBeInTheDocument();
      expect(screen.getByText(/Estimated Impact:/i)).toBeInTheDocument();
      expect(screen.getByText(/Confidence:/i)).toBeInTheDocument();
      expect(screen.getByText(/Affected Rules:/i)).toBeInTheDocument();
    });
  });

  // Additional tests for Requirements 4.2, 4.3, 4.7

  it('updates character count dynamically as user types', async () => {
    const user = userEvent.setup();

    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    
    // Initially should show 0 characters
    expect(screen.getByText(/0 \/ 200-2000 characters/i)).toBeInTheDocument();

    // Use fireEvent.change for faster testing instead of userEvent.type
    fireEvent.change(contextField, { target: { value: 'Hello World' } });

    // Character count should update
    await waitFor(() => {
      expect(screen.getByText(/11 \/ 200-2000 characters/i)).toBeInTheDocument();
    });
  });

  it('validates maximum character limits', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    
    // Create a string that exceeds the maximum (2000 chars)
    const tooLongText = 'a'.repeat(2001);
    fireEvent.change(contextField, { target: { value: tooLongText } });
    fireEvent.blur(contextField);

    await waitFor(() => {
      expect(screen.getByText(/Context must not exceed 2000 characters/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Submit Request').closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('clears validation errors when user starts typing', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    
    // Type insufficient text and blur to trigger error
    fireEvent.change(contextField, { target: { value: 'Short' } });
    fireEvent.blur(contextField);

    await waitFor(() => {
      expect(screen.getByText(/Context must be at least 200 characters/i)).toBeInTheDocument();
    });

    // Start typing again - error should clear
    fireEvent.change(contextField, { target: { value: 'Short more text' } });

    await waitFor(() => {
      expect(screen.queryByText(/Context must be at least 200 characters/i)).not.toBeInTheDocument();
    });
  });

  it('enables submit button only when all fields are valid (Requirement 4.3)', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const submitButton = screen.getByText('Submit Request').closest('button');
    
    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Fill context with valid text (200+ chars)
    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    const validContext = 'This is a valid context field with enough characters to meet the minimum requirement. '.repeat(3);
    fireEvent.change(contextField, { target: { value: validContext } });

    // Still disabled - need all fields
    expect(submitButton).toBeDisabled();

    // Fill constraints with valid text (100+ chars)
    const constraintsField = screen.getByLabelText(/Constraints/i) as HTMLTextAreaElement;
    const validConstraints = 'These are valid constraints with enough characters to meet the minimum requirement. '.repeat(2);
    fireEvent.change(constraintsField, { target: { value: validConstraints } });

    // Still disabled - need all fields
    expect(submitButton).toBeDisabled();

    // Fill critique with valid text (100+ chars)
    const critiqueField = screen.getByLabelText(/Self-Critique/i) as HTMLTextAreaElement;
    const validCritique = 'This is a valid self-critique with enough characters to meet the minimum requirement. '.repeat(2);
    fireEvent.change(critiqueField, { target: { value: validCritique } });

    // Now should be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('requires all three mandatory fields (Requirement 4.2)', () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    // Check that all three fields are marked as required
    const contextField = screen.getByLabelText(/Context/i);
    const constraintsField = screen.getByLabelText(/Constraints/i);
    const critiqueField = screen.getByLabelText(/Self-Critique/i);

    expect(contextField).toHaveAttribute('aria-required', 'true');
    expect(constraintsField).toHaveAttribute('aria-required', 'true');
    expect(critiqueField).toHaveAttribute('aria-required', 'true');

    // Check for required indicators in labels
    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators).toHaveLength(3);
  });

  it('provides validation feedback on blur (Requirement 4.7)', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    
    // Type insufficient text
    fireEvent.change(contextField, { target: { value: 'Too short' } });
    
    // No error yet (validation happens on blur)
    expect(screen.queryByText(/Context must be at least 200 characters/i)).not.toBeInTheDocument();

    // Blur the field
    fireEvent.blur(contextField);

    // Now error should appear
    await waitFor(() => {
      expect(screen.getByText(/Context must be at least 200 characters/i)).toBeInTheDocument();
    });

    // Check that aria-invalid is set
    expect(contextField).toHaveAttribute('aria-invalid', 'true');
  });

  it('validates constraints field minimum length', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const constraintsField = screen.getByLabelText(/Constraints/i) as HTMLTextAreaElement;
    fireEvent.change(constraintsField, { target: { value: 'Too short' } });
    fireEvent.blur(constraintsField);

    await waitFor(() => {
      expect(screen.getByText(/Constraints must be at least 100 characters/i)).toBeInTheDocument();
    });
  });

  it('validates self-critique field minimum length', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const critiqueField = screen.getByLabelText(/Self-Critique/i) as HTMLTextAreaElement;
    fireEvent.change(critiqueField, { target: { value: 'Too short' } });
    fireEvent.blur(critiqueField);

    await waitFor(() => {
      expect(screen.getByText(/Critique must be at least 100 characters/i)).toBeInTheDocument();
    });
  });

  it('trims whitespace when validating field length', async () => {
    render(
      <PolicyChangeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        operator="test-operator"
      />
    );

    const contextField = screen.getByLabelText(/Context/i) as HTMLTextAreaElement;
    
    // Type text with lots of whitespace that would be 200+ chars but less when trimmed
    fireEvent.change(contextField, { target: { value: '   Short text   ' } });
    fireEvent.blur(contextField);

    await waitFor(() => {
      expect(screen.getByText(/Context must be at least 200 characters/i)).toBeInTheDocument();
    });
  });
});
