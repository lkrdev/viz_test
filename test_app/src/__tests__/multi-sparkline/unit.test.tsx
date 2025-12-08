/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiSparkline } from '../../../../packages/multi-sparkline/src/MultiSparkline';

const mockQueryResponse: any = {
  fields: {
    dimensions: [
      { name: 'orders.created_date', type: 'date_date' },
      { name: 'products.brand', type: 'string' },
      { name: 'products.sku', type: 'string' }
    ],
    measures: [
      { name: 'orders.total_amount', type: 'number' }
    ]
  }
};

const mockData: any[] = [
    {
        'orders.created_date': { value: '2023-01-01' },
        'products.brand': { value: 'Netflix' },
        'products.sku': { value: 'NFLX' },
        'orders.total_amount': { value: 100 }
    },
    {
        'orders.created_date': { value: '2023-01-02' },
        'products.brand': { value: 'Netflix' },
        'products.sku': { value: 'NFLX' },
        'orders.total_amount': { value: 105 }
    },
     {
        'orders.created_date': { value: '2023-01-01' },
        'products.brand': { value: 'Amazon' },
        'products.sku': { value: 'AMZN' },
        'orders.total_amount': { value: 200 }
    },
];

describe('MultiSparkline Unit Test', () => {
  it('renders correctly with mocked data', () => {
    // Mock container dimensions for ResponsiveContainer
    Object.defineProperties(HTMLElement.prototype, {
      offsetWidth: {
        get: () => 100,
        configurable: true
      },
      offsetHeight: {
        get: () => 100,
        configurable: true
      }
    });

    render(<MultiSparkline data={mockData} queryResponse={mockQueryResponse} />);

    // Check Titles
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('NFLX')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();

    // Check Values
    // Netflix: Last value 105. Previous 100. Change +5.00 (+5.00%)
    expect(screen.getByText('$105.00')).toBeInTheDocument();
    // Use regex for partial text match if needed, but exact match should work based on component logic
    // +5.00 (5.00%)
    expect(screen.getByText((content) => content.includes('+5.00 (5.00%)'))).toBeInTheDocument();

    // Amazon: Last 200. Only one point. Prev = Current. Change 0.
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('+0.00 (0.00%)'))).toBeInTheDocument();
  });
});
