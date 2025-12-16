import { LookerChartUtils, VisualizationDefinition } from "./types";
import { format as SSF } from "ssf";

export interface SankeyNode {
  name: string;
  index?: number;
  drillLinks?: any[];
}

export interface SankeyLink {
  source: number | string | SankeyNode;
  target: number | string | SankeyNode;
  value: number;
  drillLinks?: any[];
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export function transformData(
  data: any[],
  dimensions: any[],
  measure: any,
  config: any
): SankeyData {
  const nodes = new Set<string>();
  const links: SankeyLink[] = [];

  // Map to store drill links for each unique node identifier
  const nodeDrillLinksMap = new Map<string, any[]>();

  // Determine if we should plot null points
  const showNullPoints = config.show_null_points !== false;

  data.forEach((d: any) => {
    const path: string[] = [];
    const rowDrillLinks: any[] = [];

    // Collect all drill links for this row first
    // In Looker, drill links are usually associated with specific cells (dimensions/measures).
    // The previous implementation aggregated ALL links in the row for the edge.
    // For nodes, we should probably associate the links from the specific dimension that created the node.

    // Let's refine the logic:
    // Iterate dimensions. d[dim.name] has .value and .links.

    for (const dim of dimensions) {
      if (d[dim.name].value === null && !showNullPoints) break;
      path.push(d[dim.name].value + "");
    }

    path.forEach((p: string, i: number) => {
       // Unique identifier
       const nodeIdentifier = path[i] + i + `len:${path[i].length}`;
       nodes.add(nodeIdentifier);

       // Get drill links for this specific dimension
       // dimensions[i] corresponds to path[i]
       if (dimensions[i] && d[dimensions[i].name] && d[dimensions[i].name].links) {
           const specificLinks = d[dimensions[i].name].links;
           if (!nodeDrillLinksMap.has(nodeIdentifier)) {
               nodeDrillLinksMap.set(nodeIdentifier, []);
           }
           // Add links if not already present (avoid duplicates if multiple rows have same node?
           // Actually, Sankey nodes aggregate multiple rows. "California" might appear in 50 rows.
           // If we just concat all links, we might have 50 "Filter by California" links.
           // Usually, Looker drill links are specific to the filter context.
           // If we aggregate, we might just want the first set, or unique sets.
           // However, standard Looker viz often just takes the first valid set of links for a grouped entity or merges them.
           // Let's append them all and let the Drill Menu handle it, or simpler: just take the set from the first occurrence?
           // If the drill is "Filter on State=California", it's the same for all rows.
           // So taking the first one is safe for dimensions.

           const existing = nodeDrillLinksMap.get(nodeIdentifier);
           if (existing && existing.length === 0) {
               specificLinks.forEach((l: any) => existing.push(l));
           }
       }

       if (i === path.length - 1) return;

       const sourceName = nodeIdentifier;
       const targetName = path[i + 1] + (i + 1) + `len:${path[i + 1].length}`;

       // For Links (Edges), we usually want the drill links associated with the measure or the full row context?
       // The legacy code aggregated ALL links in the row `d`.
       // "Setup drill links... for (const key in d)..."
       // We will keep that behavior for Edges.

       const linkDrillLinks: any[] = [];
       for (const key in d) {
          if (d[key].links) {
            d[key].links.forEach((link: any) => {
              linkDrillLinks.push(link);
            });
          }
       }

       links.push({
        source: sourceName,
        target: targetName,
        value: +d[measure.name].value,
        drillLinks: linkDrillLinks,
      });
    });
  });

  // Convert Set to Array for node indexing
  const nodesArray = Array.from(nodes);

  // Map link source/target to indices
  const indexedLinks = links.map((link) => {
    return {
      ...link,
      source: nodesArray.indexOf(link.source as string),
      target: nodesArray.indexOf(link.target as string),
    };
  });

  // Clean up node names (removing the unique ID suffix) for display
  const finalNodes = nodesArray.map((nodeIdentifier) => {
    const parts = nodeIdentifier.split("len:");
    const originalLength = parseInt(parts[1], 10);

    return {
      name: nodeIdentifier.slice(0, originalLength),
      drillLinks: nodeDrillLinksMap.get(nodeIdentifier) || [],
    };
  });

  return {
    nodes: finalNodes,
    links: indexedLinks,
  };
}
