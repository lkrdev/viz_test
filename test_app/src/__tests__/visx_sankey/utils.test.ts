import { transformData, SankeyData } from '../../../../packages/visx_sankey/src/utils';

describe('transformData', () => {
  const dimensions = [
    { name: 'dim1', label: 'Dimension 1' },
    { name: 'dim2', label: 'Dimension 2' },
  ];
  const measure = { name: 'meas1', label: 'Measure 1' };

  it('should return empty nodes and links if data is empty', () => {
    const result = transformData([], dimensions, measure);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it('should transform simple 2-stage data', () => {
    const data = [
      {
        dim1: { value: 'A' },
        dim2: { value: 'X' },
        meas1: { value: 10 },
      },
      {
        dim1: { value: 'A' },
        dim2: { value: 'Y' },
        meas1: { value: 20 },
      },
      {
        dim1: { value: 'B' },
        dim2: { value: 'X' },
        meas1: { value: 30 },
      },
    ];

    const result = transformData(data, dimensions, measure);

    // Nodes: A(depth0), B(depth0), X(depth1), Y(depth1)
    // Order depends on processing order.
    // A -> X (10)
    // A -> Y (20)
    // B -> X (30)

    expect(result.nodes.length).toBe(4);
    expect(result.links.length).toBe(3);

    const nodeA = result.nodes.find(n => n.name === 'A' && n.depth === 0);
    const nodeB = result.nodes.find(n => n.name === 'B' && n.depth === 0);
    const nodeX = result.nodes.find(n => n.name === 'X' && n.depth === 1);
    const nodeY = result.nodes.find(n => n.name === 'Y' && n.depth === 1);

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    expect(nodeX).toBeDefined();
    expect(nodeY).toBeDefined();

    // Check Links
    // Link A -> X
    const linkAX = result.links.find(l => l.source === result.nodes.indexOf(nodeA!) && l.target === result.nodes.indexOf(nodeX!));
    expect(linkAX).toBeDefined();
    expect(linkAX?.value).toBe(10);

    // Link A -> Y
    const linkAY = result.links.find(l => l.source === result.nodes.indexOf(nodeA!) && l.target === result.nodes.indexOf(nodeY!));
    expect(linkAY?.value).toBe(20);

    // Link B -> X
    const linkBX = result.links.find(l => l.source === result.nodes.indexOf(nodeB!) && l.target === result.nodes.indexOf(nodeX!));
    expect(linkBX?.value).toBe(30);
  });

  it('should transform 3-stage data (multi-stage)', () => {
    const dims3 = [
      { name: 'dim1' },
      { name: 'dim2' },
      { name: 'dim3' },
    ];

    const data = [
      {
        dim1: { value: 'Source' },
        dim2: { value: 'Mid' },
        dim3: { value: 'Target' },
        meas1: { value: 50 },
      }
    ];

    const result = transformData(data, dims3, measure);

    // Nodes: Source(0), Mid(1), Target(2)
    expect(result.nodes.length).toBe(3);

    // Links: Source->Mid (50), Mid->Target (50)
    expect(result.links.length).toBe(2);

    const source = result.nodes.find(n => n.name === 'Source');
    const mid = result.nodes.find(n => n.name === 'Mid');
    const target = result.nodes.find(n => n.name === 'Target');

    expect(source?.depth).toBe(0);
    expect(mid?.depth).toBe(1);
    expect(target?.depth).toBe(2);

    const link1 = result.links.find(l => l.source === result.nodes.indexOf(source!) && l.target === result.nodes.indexOf(mid!));
    const link2 = result.links.find(l => l.source === result.nodes.indexOf(mid!) && l.target === result.nodes.indexOf(target!));

    expect(link1?.value).toBe(50);
    expect(link2?.value).toBe(50);
  });

  it('should aggregate links with same source/target', () => {
     const data = [
      {
        dim1: { value: 'A' },
        dim2: { value: 'B' },
        meas1: { value: 10 },
      },
      {
        dim1: { value: 'A' },
        dim2: { value: 'B' },
        meas1: { value: 15 },
      },
    ];

    const result = transformData(data, dimensions, measure);

    expect(result.nodes.length).toBe(2);
    expect(result.links.length).toBe(1);
    expect(result.links[0].value).toBe(25);
  });
});
