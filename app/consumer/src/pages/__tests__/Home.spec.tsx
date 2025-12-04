import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';

// Mock child components to simplify testing
vi.mock('../../components/HeroVisuals', () => ({
  FloatingFoodCards: () => <div data-testid="floating-food-cards">Floating Food Cards</div>,
}));

vi.mock('../../components/ModeSwitch', () => ({
  ModeSwitch: () => <div data-testid="mode-switch">Mode Switch</div>,
}));

vi.mock('../../components/ProofStrip', () => ({
  ProofStrip: () => <div data-testid="proof-strip">Proof Strip</div>,
}));

vi.mock('../../components/BusinessModeModal', () => ({
  BusinessModeModal: () => <div data-testid="business-modal">Business Modal</div>,
}));

const renderHome = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

describe('Home Page', () => {
  describe('Hero Section', () => {
    it('should render the main title', () => {
      renderHome();
      expect(screen.getByText('ClaimLens Go')).toBeInTheDocument();
    });

    it('should render the subtitle with proof-first messaging', () => {
      renderHome();
      expect(screen.getByText(/Proof-first checks for risky food claims/i)).toBeInTheDocument();
    });

    it('should render Start Scanning CTA button', () => {
      renderHome();
      const startButtons = screen.getAllByRole('link', { name: /Start Scanning/i });
      expect(startButtons.length).toBeGreaterThan(0);
      expect(startButtons[0]).toHaveAttribute('href', '/scan');
    });

    it('should render Try Demo button', () => {
      renderHome();
      expect(screen.getByRole('button', { name: /Try Demo/i })).toBeInTheDocument();
    });
  });

  describe('What We Check / What We Don\'t Section', () => {
    it('should render the section heading', () => {
      renderHome();
      expect(screen.getByText('What We Check / What We Don\'t')).toBeInTheDocument();
    });

    it('should render the expectations callout', () => {
      renderHome();
      expect(screen.getByText('Setting Expectations')).toBeInTheDocument();
      expect(screen.getByText(/ClaimLens evaluates/i)).toBeInTheDocument();
      expect(screen.getByText(/compliance language/i)).toBeInTheDocument();
    });

    it('should render "What We Check" column', () => {
      renderHome();
      expect(screen.getByText('What We Check')).toBeInTheDocument();
    });

    it('should render "What We Don\'t Check" column', () => {
      renderHome();
      expect(screen.getByText('What We Don\'t Check')).toBeInTheDocument();
    });

    it('should list banned health claims check', () => {
      renderHome();
      expect(screen.getByText('Banned Health Claims')).toBeInTheDocument();
    });

    it('should list product recalls check', () => {
      renderHome();
      expect(screen.getByText('Product Recalls')).toBeInTheDocument();
    });

    it('should list allergens check', () => {
      renderHome();
      expect(screen.getByText('Your Allergens')).toBeInTheDocument();
    });

    it('should list weasel words check', () => {
      renderHome();
      expect(screen.getByText('Weasel Words')).toBeInTheDocument();
    });

    it('should list missing disclaimers check', () => {
      renderHome();
      expect(screen.getByText('Missing Disclaimers')).toBeInTheDocument();
    });

    it('should clarify no lab testing', () => {
      renderHome();
      expect(screen.getByText('Lab Testing')).toBeInTheDocument();
      expect(screen.getByText(/We don't test for contaminants/i)).toBeInTheDocument();
    });

    it('should clarify no medical diagnosis', () => {
      renderHome();
      expect(screen.getByText('Medical Diagnosis')).toBeInTheDocument();
      expect(screen.getByText(/Not a substitute for professional medical advice/i)).toBeInTheDocument();
    });

    it('should clarify no nutritional quality assessment', () => {
      renderHome();
      expect(screen.getByText('Nutritional Quality')).toBeInTheDocument();
    });

    it('should clarify no taste or quality assessment', () => {
      renderHome();
      expect(screen.getByText('Taste or Quality')).toBeInTheDocument();
    });
  });

  describe('How It Works Section', () => {
    it('should render the section heading', () => {
      renderHome();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
    });

    it('should render three steps', () => {
      renderHome();
      expect(screen.getByText('Scan')).toBeInTheDocument();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('Decide')).toBeInTheDocument();
    });

    it('should show scan methods', () => {
      renderHome();
      expect(screen.getByText(/URL • Screenshot • Barcode • Text/i)).toBeInTheDocument();
    });

    it('should show analysis methods', () => {
      renderHome();
      expect(screen.getByText(/Policy Packs • Allergen Profile • Recalls/i)).toBeInTheDocument();
    });

    it('should show decision outputs', () => {
      renderHome();
      expect(screen.getByText(/Allow • Modify • Avoid/i)).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('should render 4 Ways to Scan feature', () => {
      renderHome();
      expect(screen.getByText('4 Ways to Scan')).toBeInTheDocument();
    });

    it('should render Trust Score feature', () => {
      renderHome();
      expect(screen.getByText('Trust Score 0-100')).toBeInTheDocument();
    });

    it('should render Allergen Alerts feature', () => {
      renderHome();
      expect(screen.getByText('Allergen Alerts')).toBeInTheDocument();
    });

    it('should render Safer Alternatives feature', () => {
      renderHome();
      expect(screen.getByText('Safer Alternatives')).toBeInTheDocument();
    });

    it('should render Works Offline feature', () => {
      renderHome();
      expect(screen.getByText('Works Offline')).toBeInTheDocument();
    });

    it('should render Privacy First feature', () => {
      renderHome();
      expect(screen.getByText('Privacy First')).toBeInTheDocument();
    });
  });

  describe('Final CTA Section', () => {
    it('should render final CTA heading', () => {
      renderHome();
      expect(screen.getByText('Ready to Make Informed Food Choices?')).toBeInTheDocument();
    });

    it('should render final CTA button', () => {
      renderHome();
      const ctaButtons = screen.getAllByRole('link', { name: /Start Scanning/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('should display trust messaging', () => {
      renderHome();
      expect(screen.getByText(/Free to use • No account required • Privacy-focused/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render FloatingFoodCards component', () => {
      renderHome();
      expect(screen.getByTestId('floating-food-cards')).toBeInTheDocument();
    });

    it('should render ModeSwitch component', () => {
      renderHome();
      expect(screen.getByTestId('mode-switch')).toBeInTheDocument();
    });

    it('should render ProofStrip component', () => {
      renderHome();
      expect(screen.getByTestId('proof-strip')).toBeInTheDocument();
    });
  });
});
