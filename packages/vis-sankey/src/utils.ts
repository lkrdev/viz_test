import { LookerChartUtils, VisualizationDefinition } from "./types";
import { format as SSF } from "ssf";

export interface SankeyNode {
  name: string;
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
  const nodeMap = new Map<string, { name: string, drillLinks: any[] }>();
  const linkMap = new Map<string, SankeyLink>();

  // Determine if we should plot null points
  const showNullPoints = config.show_null_points !== false;

  data.forEach((d: any) => {
    const path: string[] = [];
    const pathDims: any[] = [];

    // Extract dimension values for the path
    for (const dim of dimensions) {
      if (d[dim.name].value === null && !showNullPoints) break;
      path.push(d[dim.name].value + "");
      pathDims.push(dim);
    }

    // Create links between consecutive dimensions in the path
    path.forEach((p: string, i: number) => {
      // Handle Node creation/update
      // Logic: Value + index + length
      const nodeName = p + i + `len:${p.length}`;

      // Get drill links for this node
      // The node corresponds to the dimension at index i
      const dim = pathDims[i];
      const nodeDrills = d[dim.name]?.links || [];

      if (!nodeMap.has(nodeName)) {
        nodeMap.set(nodeName, {
          name: nodeName, // Temporarily store full ID
          drillLinks: nodeDrills
        });
      } else {
        // Optional: merge drill links if they differ, but usually for same value they are same.
        // We'll keep the first set found.
      }

      if (i === path.length - 1) return;

      const sourceName = nodeName;
      const targetName = path[i + 1] + (i + 1) + `len:${path[i + 1].length}`;

      // Ensure target node exists too (it will be processed as source in next iter,
      // but for the last element it won't be a source)
      if (!nodeMap.has(targetName)) {
         const targetDim = pathDims[i+1];
         const targetDrills = d[targetDim.name]?.links || [];
         nodeMap.set(targetName, {
           name: targetName,
           drillLinks: targetDrills
         });
      }

      const linkKey = `${sourceName}-${targetName}`;
      const value = +d[measure.name].value;

      // Collect drill links for the LINK (usually aggregate of row drills or measure drills)
      // The legacy code put ALL row drills on the link.
      const rowDrills: any[] = [];
      for (const key in d) {
        if (d[key].links) {
          d[key].links.forEach((link: any) => {
            rowDrills.push(link);
          });
        }
      }

      if (linkMap.has(linkKey)) {
        const existingLink = linkMap.get(linkKey)!;
        existingLink.value += value;
        // Aggregate unique drill links? For now just concat
         existingLink.drillLinks = (existingLink.drillLinks || []).concat(rowDrills);
      } else {
        linkMap.set(linkKey, {
          source: sourceName,
          target: targetName,
          value: value,
          drillLinks: rowDrills,
        });
      }
    });
  });

  // Convert Map to Array for node indexing
  const nodesArray = Array.from(nodeMap.values());
  const links = Array.from(linkMap.values());

  // Map link source/target to indices
  // We need to map the source/target *names* to the index in nodesArray
  // nodesArray contains objects { name: "...", drillLinks: ... }
  const nodeNameIndexMap = new Map<string, number>();
  nodesArray.forEach((n, idx) => nodeNameIndexMap.set(n.name, idx));

  const indexedLinks = links.map((link) => {
    return {
      ...link,
      source: nodeNameIndexMap.get(link.source as string)!,
      target: nodeNameIndexMap.get(link.target as string)!,
    };
  });

  // Clean up node names for display
  const finalNodes = nodesArray.map((nodeObj) => {
    const parts = nodeObj.name.split("len:");
    const originalLength = parseInt(parts[1], 10);

    return {
      name: nodeObj.name.slice(0, originalLength),
      drillLinks: nodeObj.drillLinks
    };
  });

  return {
    nodes: finalNodes,
    links: indexedLinks,
  };
}
