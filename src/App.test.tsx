import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { SIMON_COLORS } from './game/colors';

describe('App shell', () => {
  it('shows the home screen by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'סיימון' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'שלב 1 מתוך 10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
  });

  it('renders the four board pads', () => {
    render(<App />);
    for (const name of ['ירוק', 'אדום', 'צהוב', 'כחול']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('navigates to About and back to Home', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'אודות' }));
    expect(screen.getByRole('heading', { name: 'על המשחק' })).toBeInTheDocument();
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ירוק' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByRole('heading', { level: 1, name: 'סיימון' })).toBeInTheDocument();
  });

  it('marks the active nav item with aria-current', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'בית' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'אודות' })).not.toHaveAttribute('aria-current');

    await user.click(screen.getByRole('button', { name: 'אודות' }));
    expect(screen.getByRole('button', { name: 'אודות' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'בית' })).not.toHaveAttribute('aria-current');
  });
});

describe('board colors', () => {
  it('uses the required spatial layout', () => {
    const byPosition = Object.fromEntries(SIMON_COLORS.map((c) => [c.position, c.id]));
    expect(byPosition).toEqual({
      'top-left': 'green',
      'top-right': 'red',
      'bottom-left': 'yellow',
      'bottom-right': 'blue',
    });
  });
});
