import React, { useMemo, useEffect } from 'react';
import { Sankey } from '@visx/sankey';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { sankeyLinkHorizontal } from 'd3-sankey';
import { transformData, SankeyData, SankeyNode, SankeyLink } from './utils';
import { DrillableCell } from './components/DrillableCell';
import { useViz } from './components/VizContext';

interface VisxSankeyProps {
  width: number;
  height: number;
}

const VisxSankey: React.FC<VisxSankeyProps> = ({ width, height }) => {
  const { data, config, queryResponse, onRenderComplete } = useViz();

  const {
    node_width = 20,
    node_padding = 20,
    link_opacity = 0.5,
    show_labels = true,
    color_range,
  } = config;

  const sankeyData: SankeyData = useMemo(() => {
    if (!data || !queryResponse?.fields?.dimensions || !queryResponse?.fields?.measures) {
      return { nodes: [], links: [] };
    }
    const dimensions = queryResponse.fields.dimensions;
    const measure = queryResponse.fields.measures[0];
    return transformData(data, dimensions, measure);
  }, [data, queryResponse]);

  const colorScale = useMemo(() => {
    const range = color_range || ['#dd3333', '#888888', '#33dd33', '#3333dd'];
    return scaleOrdinal({
      domain: sankeyData.nodes.map((node) => node.name),
      range: Array.isArray(range) ? range : ['#70ceea', '#7fc97f', '#beaed4', '#fdc086', '#ffff99'],
    });
  }, [sankeyData.nodes, color_range]);

  useEffect(() => {
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete, sankeyData]);

  if (width < 10 || height < 10) return null;
  if (sankeyData.nodes.length === 0) return <div>No Data</div>;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <Sankey
        // @ts-ignore
        root={undefined}
        // @ts-ignore
        nodes={sankeyData.nodes}
        // @ts-ignore
        links={sankeyData.links}
        nodeWidth={Number(node_width)}
        nodePadding={Number(node_padding)}
        extent={[
          [0, 0],
          [width, height],
        ]}
        nodeId={(node: any) => node.index}
      >
        {({ data }: any) => {
          // Destructure properly based on Visx behavior
          // If TS error persists, use 'any' cast on the arg

          const graph = data?.graph || data;
          const nodes = graph?.nodes || [];
          const links = graph?.links || [];

          return (
            <Group>
              {links.map((link: any, i: number) => {
                 const path = sankeyLinkHorizontal()(link);
                 return (
                  <path
                    key={`link-${i}`}
                    d={path || ''}
                    fill={link.source.color || colorScale(link.source.name)}
                    fillOpacity={Number(link_opacity)}
                    stroke="none"
                    style={{ mixBlendMode: 'multiply' }}
                  >
                    <title>
                      {`${link.source.name} → ${link.target.name}: ${link.value}`}
                    </title>
                  </path>
                );
              })}

              {nodes.map((node: any, i: number) => {
                 const color = colorScale(node.name);
                 node.color = color;

                 return (
                  <Group key={`node-${i}`} top={node.y0} left={node.x0}>
                    <rect
                      width={Math.max(0, node.x1 - node.x0)}
                      height={Math.max(0, node.y1 - node.y0)}
                      fill={color}
                      opacity={0.8}
                      stroke="#333"
                      strokeWidth={0.5}
                    />

                    {show_labels && (
                        <foreignObject
                            x={0}
                            y={0}
                            width={200}
                            height={Math.max(0, node.y1 - node.y0)}
                            style={{ overflow: 'visible', pointerEvents: 'none' }}
                        >
                            <div style={{
                                marginTop: (node.y1 - node.y0) / 2 - 10,
                                marginLeft: node.x1 - node.x0 + 5,
                                whiteSpace: 'nowrap',
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                pointerEvents: 'auto'
                            }}>
                                <DrillableCell
                                    cell={{
                                        value: node.value,
                                        links: node.drillLinks,
                                        html: `<span style="font-weight:bold;color:#333;">${node.name} (${node.value})</span>`
                                    }}
                                />
                            </div>
                        </foreignObject>
                    )}
                  </Group>
                );
              })}
            </Group>
          );
        }}
      </Sankey>
    </svg>
  );
};

export default VisxSankey;
