import { VisData, VisQueryResponse, Cell, Link } from './types';

export interface SankeyNode {
  name: string;
  index?: number;
  cell?: Cell; // Representative cell for drilling
  depth?: number;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  sourceName?: string;
  targetName?: string;
  measureCell?: Cell; // Representative cell for drilling
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export const processSankeyData = (data: VisData, queryResponse: VisQueryResponse): SankeyData => {
  const dimensions = queryResponse.fields.dimensions;
  const measures = queryResponse.fields.measures;

  if (!dimensions || dimensions.length < 1 || !measures || measures.length < 1) {
    return { nodes: [], links: [] };
  }

  const measureName = measures[0].name;

  const nodeMap = new Map<string, SankeyNode>();
  const linkMap = new Map<string, SankeyLink>();

  const getNodeKey = (dimName: string, value: any) => `${dimName}:${value}`;

  // Helper to add node
  const addNode = (dimName: string, cell: Cell) => {
    const key = getNodeKey(dimName, cell.value);
    if (!nodeMap.has(key)) {
      nodeMap.set(key, {
        name: cell.rendered || `${cell.value}`,
        cell: cell
      });
    }
    return key;
  };

  data.forEach(row => {
    const measureValue = row[measureName].value;
    if (measureValue === null || measureValue === undefined) return;
    const val = Number(measureValue);
    if (isNaN(val) || val <= 0) return; // Sankey usually needs positive values

    // Create nodes for this row
    for (let i = 0; i < dimensions.length; i++) {
        const dim = dimensions[i];
        const cell = row[dim.name];
        addNode(dim.name, cell as Cell);
    }

    // Create links
    if (dimensions.length >= 2) {
        for (let i = 0; i < dimensions.length - 1; i++) {
            const sourceDim = dimensions[i];
            const targetDim = dimensions[i+1];
            const sourceCell = row[sourceDim.name] as Cell;
            const targetCell = row[targetDim.name] as Cell;

            const sourceKey = getNodeKey(sourceDim.name, sourceCell.value);
            const targetKey = getNodeKey(targetDim.name, targetCell.value);
            const linkKey = `${sourceKey}->${targetKey}`;

            if (!linkMap.has(linkKey)) {
                // Find indices later
                linkMap.set(linkKey, {
                    source: -1, // Placeholder
                    target: -1,
                    value: 0,
                    sourceName: sourceKey,
                    targetName: targetKey,
                    measureCell: row[measureName] as Cell // Store first row's measure cell
                });
            }

            const link = linkMap.get(linkKey)!;
            link.value += val;
        }
    }
  });

  const nodes = Array.from(nodeMap.values());
  const nodeKeyToIndex = new Map<string, number>();

  // We need to map keys back to indices
  let idx = 0;
  const mapEntries = Array.from(nodeMap.entries());
  for (let i = 0; i < mapEntries.length; i++) {
      const [key, node] = mapEntries[i];
      node.index = idx; // Optional but good for debug
      nodeKeyToIndex.set(key, idx);
      idx++;
  }

  const links: SankeyLink[] = [];
  const mapLinks = Array.from(linkMap.values());
  for (let i = 0; i < mapLinks.length; i++) {
      const link = mapLinks[i];
      const sourceIdx = nodeKeyToIndex.get(link.sourceName!);
      const targetIdx = nodeKeyToIndex.get(link.targetName!);

      if (sourceIdx !== undefined && targetIdx !== undefined) {
          links.push({
              source: sourceIdx,
              target: targetIdx,
              value: link.value,
              sourceName: link.sourceName,
              targetName: link.targetName,
              measureCell: link.measureCell
          });
      }
  }

  return { nodes, links };
};
