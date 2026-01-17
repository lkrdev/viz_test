import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Gauge } from '../components/Gauge';

describe('Gauge Component', () => {
  const defaultProps = {
    value: 50,
    min: 0,
    max: 100,
    label: 'Test Label',
    dialColor: '#3366cc',
    lineWidth: 20,
    width: 200,
    height: 100,
  };

  test('renders without crashing', () => {
    render(<Gauge {...defaultProps} />);
    const svgElement = screen.getByText('Test Label').closest('svg');
    expect(svgElement).toBeInTheDocument();
  });

  test('displays the correct value and label', () => {
    render(<Gauge {...defaultProps} />);
    expect(screen.getByText('50.00')).toBeInTheDocument();
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('renders with target', () => {
      render(<Gauge {...defaultProps} target={75} />);
      expect(screen.getByText('Target: 75')).toBeInTheDocument();
  });
});
