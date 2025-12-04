import { render, screen } from '@testing-library/react';
import Logo from '@/components/Logo';

describe('Logo', () => {
  it('renders CadArena text', () => {
    render(<Logo />);
    expect(screen.getByText(/CadArena/i)).toBeInTheDocument();
  });
});


