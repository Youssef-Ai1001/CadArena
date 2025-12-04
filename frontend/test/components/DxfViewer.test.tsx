import { render, screen } from '@testing-library/react';
import DxfViewer from '@/components/DxfViewer';

describe('DxfViewer', () => {
  it('shows empty state when no DXF content', () => {
    render(<DxfViewer dxfContent={null} projectTitle="Test Project" />);
    expect(screen.getByText(/No DXF content yet/i)).toBeInTheDocument();
  });
});


