/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import React from 'react';

// Mock Recharts to avoid ResizeObserver and JSDOM SVG issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div data-testid="barchart" />,
  Bar: () => <div />,
  LineChart: () => <div data-testid="linechart" />,
  Line: () => <div />,
  PieChart: () => <div data-testid="piechart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  Area: () => <div />,
  AreaChart: () => <div />
}));

vi.mock('leaflet', () => {
  const L = {
    Icon: {
      Default: {
        prototype: { _getIconUrl: {} },
        mergeOptions: vi.fn()
      }
    },
    map: vi.fn(),
    tileLayer: vi.fn(),
    marker: vi.fn(),
  };
  return {
    default: L,
    ...L
  };
});

describe('App Component', () => {
  it('renders SAMRAKSHA text somewhere', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('SAMRAKSHA');
  });

  it('renders Badge No. input on login screen', () => {
    render(<App />);
    expect(screen.getAllByPlaceholderText(/e\.g\., ADMIN001/i).length).toBeGreaterThan(0);
  });
});
