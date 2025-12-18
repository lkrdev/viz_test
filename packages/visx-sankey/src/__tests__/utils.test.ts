import { processSankeyData } from '../utils';
import { VisData, VisQueryResponse } from '../types';

describe('processSankeyData', () => {
  const mockQueryResponse = (dims: string[], measure: string): VisQueryResponse => ({
    data: [],
    fields: {
      dimensions: dims.map(name => ({ name, label: name, label_short: name })),
      measures: [{ name: measure, label: measure, label_short: measure }],
      table_calculations: [],
      pivots: []
    },
    pivots: []
  });

  const createCell = (value: any) => ({ value, rendered: String(value), links: [] });

  it('should return empty nodes/links if data is empty', () => {
    const data: VisData = [];
    const response = mockQueryResponse(['dim1', 'dim2'], 'measure');
    const result = processSankeyData(data, response);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it('should process 2 dimensions and 1 measure', () => {
    const response = mockQueryResponse(['source', 'target'], 'count');
    const data: VisData = [
      {
        source: createCell('A'),
        target: createCell('B'),
        count: createCell(10)
      },
      {
        source: createCell('A'),
        target: createCell('C'),
        count: createCell(5)
      }
    ];

    const result = processSankeyData(data, response);

    // Nodes: A, B, C (actually keyed by dim:value)
    // source:A, target:B, target:C
    expect(result.nodes.length).toBe(3);

    // Links: A->B (10), A->C (5)
    expect(result.links.length).toBe(2);

    const linkAB = result.links.find(l =>
        result.nodes[l.source].name === 'A' &&
        result.nodes[l.target].name === 'B'
    );
    expect(linkAB).toBeDefined();
    expect(linkAB?.value).toBe(10);
  });

  it('should handle multi-step flow (3 dimensions)', () => {
    const response = mockQueryResponse(['step1', 'step2', 'step3'], 'count');
    const data: VisData = [
      {
        step1: createCell('Start'),
        step2: createCell('Mid'),
        step3: createCell('End'),
        count: createCell(20)
      }
    ];

    const result = processSankeyData(data, response);

    // Nodes: Start, Mid, End
    expect(result.nodes.length).toBe(3);

    // Links: Start->Mid, Mid->End
    expect(result.links.length).toBe(2);

    expect(result.links[0].value).toBe(20);
    expect(result.links[1].value).toBe(20);
  });
});
