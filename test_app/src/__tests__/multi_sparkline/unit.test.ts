import { processData } from '../../../../packages/multi_sparkline/src/utils';
import { VisData, VisQueryResponse } from '../../../../packages/multi_sparkline/src/types';

const mockData: VisData = [
    {
        'date.date': { value: '2023-01-01', rendered: '2023-01-01' },
        'product.brand': { value: 'Brand A', rendered: 'Brand A' },
        'product.name': { value: 'Product X', rendered: 'Product X' },
        'sales.amount': { value: 100, rendered: '$100' }
    },
    {
        'date.date': { value: '2023-01-02', rendered: '2023-01-02' },
        'product.brand': { value: 'Brand A', rendered: 'Brand A' },
        'product.name': { value: 'Product X', rendered: 'Product X' },
        'sales.amount': { value: 150, rendered: '$150' }
    },
    {
        'date.date': { value: '2023-01-01', rendered: '2023-01-01' },
        'product.brand': { value: 'Brand B', rendered: 'Brand B' },
        'product.name': { value: 'Product Y', rendered: 'Product Y' },
        'sales.amount': { value: 200, rendered: '$200' }
    }
];

const mockQueryResponse: VisQueryResponse = {
    data: mockData,
    fields: {
        dimensions: [
            { name: 'date.date', label: 'Date', type: 'date', values: [], order: 0 },
            { name: 'product.brand', label: 'Brand', type: 'string', values: [], order: 1 },
            { name: 'product.name', label: 'Product Name', type: 'string', values: [], order: 2 }
        ],
        measures: [
            { name: 'sales.amount', label: 'Sales', type: 'number', values: [], order: 0 }
        ]
    },
    pivots: []
};

describe('processData', () => {
    it('groups data correctly', () => {
        const result = processData(mockData, mockQueryResponse);
        expect(result).toHaveLength(2); // Brand A|Product X and Brand B|Product Y

        const groupA = result.find(g => g.id === 'Brand A|Product X');
        expect(groupA).toBeDefined();
        if (groupA) {
            expect(groupA.data).toHaveLength(2);
            expect(groupA.currentValue).toBe(150);
            expect(groupA.previousValue).toBe(100);
            expect(groupA.change).toBe(50);
            expect(groupA.percentChange).toBe(0.5);
            expect(groupA.labelCell1.value).toBe('Brand A');
            expect(groupA.labelCell2?.value).toBe('Product X');
        }

        const groupB = result.find(g => g.id === 'Brand B|Product Y');
        expect(groupB).toBeDefined();
        if (groupB) {
            expect(groupB.data).toHaveLength(1);
            expect(groupB.currentValue).toBe(200);
            expect(groupB.previousValue).toBe(0); // No previous
            expect(groupB.change).toBe(0);
        }
    });
});
