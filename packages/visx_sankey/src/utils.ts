// Remove unused imports

export interface SankeyNode {
  name: string;
  index?: number;
  depth?: number;
  value?: number; // Added value
  drillLinks?: any[]; // Added drillLinks
  [key: string]: any;
}

export interface SankeyLink {
  source: number | SankeyNode; // d3-sankey replaces indices with objects
  target: number | SankeyNode;
  value: number;
  drillLinks?: any[];
  [key: string]: any;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export const transformData = (
  data: any[],
  dimensions: any[],
  measure: any
): SankeyData => {
  if (!data || !data.length || !dimensions || dimensions.length < 2 || !measure) {
    return { nodes: [], links: [] };
  }

  const nodesMap = new Map<string, number>();
  const nodes: SankeyNode[] = [];
  const linksMap = new Map<string, SankeyLink>();

  const getNodeIndex = (value: string, depth: number, drillLinks: any[]) => {
    const key = `${depth}:${value}`;
    if (!nodesMap.has(key)) {
      nodesMap.set(key, nodes.length);
      nodes.push({
          name: value,
          depth,
          drillLinks: drillLinks || []
      });
    } else {
        const index = nodesMap.get(key)!;
        if (drillLinks && nodes[index].drillLinks) {
             // Logic for merging drill links if necessary
        }
    }
    return nodesMap.get(key)!;
  };

  data.forEach((row) => {
    const measureValue = row[measure.name].value;
    const measureLinks = row[measure.name].links;

    for (let i = 0; i < dimensions.length - 1; i++) {
      const sourceDim = dimensions[i];
      const targetDim = dimensions[i + 1];

      const sourceVal = row[sourceDim.name].value?.toString() || 'null';
      const targetVal = row[targetDim.name].value?.toString() || 'null';

      const sourceLinks = row[sourceDim.name].links;
      const targetLinks = row[targetDim.name].links;

      const sourceIndex = getNodeIndex(sourceVal, i, sourceLinks);
      const targetIndex = getNodeIndex(targetVal, i + 1, targetLinks);

      const linkKey = `${sourceIndex}-${targetIndex}`;

      if (linksMap.has(linkKey)) {
        const link = linksMap.get(linkKey)!;
        link.value += measureValue;
        // Merge measure links for the link drill?
      } else {
        linksMap.set(linkKey, {
          source: sourceIndex,
          target: targetIndex,
          value: measureValue,
          drillLinks: measureLinks, // Use measure links for the flow drill
        });
      }
    }
  });

  return {
    nodes,
    links: Array.from(linksMap.values()),
  };
};
