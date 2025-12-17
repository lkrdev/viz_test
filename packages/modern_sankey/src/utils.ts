import { format as SSF } from 'ssf';

export interface LookerDimension {
  name: string;
  label: string;
  is_numeric: boolean;
}

export interface LookerMeasure {
  name: string;
  label: string;
  value_format: string | null;
  type: string;
}

export interface LookerLink {
  label: string;
  url: string;
  type: string;
  icon_url: string;
}

export interface LookerNode {
  name: string;
  index?: number;
}

export interface LookerSankeyLink {
  source: number;
  target: number;
  value: number;
  drillLinks: LookerLink[];
}

export interface SankeyGraph {
  nodes: LookerNode[];
  links: LookerSankeyLink[];
}

export const processData = (
  data: any[],
  queryResponse: any,
  config: any
): SankeyGraph => {
  const dimensions = queryResponse.fields.dimension_like;
  const measure = queryResponse.fields.measure_like[0];
  const showNullPoints = config.show_null_points ?? true;

  const nodesSet = new Set<string>();
  const linksMap = new Map<string, { source: string; target: string; value: number; drillLinks: LookerLink[] }>();

  data.forEach((d: any) => {
    // Construct path from dimensions
    const path: string[] = [];
    for (const dim of dimensions) {
      if (d[dim.name].value === null && !showNullPoints) break;
      path.push(String(d[dim.name].value));
    }

    // Collect drill links from all fields in the row
    const drillLinks: LookerLink[] = [];
    for (const key in d) {
       if (d[key].links) {
         d[key].links.forEach((link: LookerLink) => {
           drillLinks.push(link);
         });
       }
    }

    path.forEach((nodeName, i) => {
      if (i === path.length - 1) return;

      // Create unique identifiers for nodes at each level to distinguish same-named nodes at different steps
      // Using index in the path to ensure uniqueness across columns
      const sourceName = `${nodeName}::${i}`;
      const targetName = `${path[i+1]}::${i+1}`;

      nodesSet.add(sourceName);
      nodesSet.add(targetName);

      const linkKey = `${sourceName}->${targetName}`;
      const existingLink = linksMap.get(linkKey);

      const value = d[measure.name].value;

      if (existingLink) {
        existingLink.value += value;
        existingLink.drillLinks.push(...drillLinks);
      } else {
        linksMap.set(linkKey, {
          source: sourceName,
          target: targetName,
          value: value,
          drillLinks: [...drillLinks] // Copy to avoid reference issues
        });
      }
    });
  });

  const nodesArray = Array.from(nodesSet);
  const nodes = nodesArray.map((name) => ({ name: name.split('::')[0] }));

  const links = Array.from(linksMap.values()).map((link) => ({
    source: nodesArray.indexOf(link.source),
    target: nodesArray.indexOf(link.target),
    value: link.value,
    drillLinks: link.drillLinks
  }));

  return { nodes, links };
};
