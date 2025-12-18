import React, { useEffect, useMemo } from 'react';
import { useViz } from './VizContext';
import { DrillableCell } from './DrillableCell';
import { Sankey } from '@visx/sankey';
import { ParentSize } from '@visx/responsive';
import { processSankeyData } from '../utils';
import { scaleOrdinal } from '@visx/scale';
import { sankeyLinkHorizontal } from 'd3-sankey';
import { LookerChartUtils } from '../types';

declare var LookerCharts: LookerChartUtils;

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, queryResponse, onRenderComplete } = useViz();

  const sankeyData = useMemo(() => {
    return processSankeyData(data, queryResponse);
  }, [data, queryResponse]);

  const colorScale = useMemo(() => {
     const range = (config.color_range as string[]) || [
        '#00bcd4', '#ffc107', '#e91e63', '#9c27b0', '#673ab7',
        '#3f51b5', '#2196f3', '#03a9f4', '#009688', '#4caf50',
        '#8bc34a', '#cddc39', '#ff9800', '#ff5722', '#795548'
     ];
     // Create a domain from all node names
     return scaleOrdinal({
         domain: sankeyData.nodes.map(n => n.name),
         range: range
     });
  }, [sankeyData, config.color_range]);

  const nodePadding = config.node_padding ? Number(config.node_padding) : 50;
  const nodeWidth = config.node_width ? Number(config.node_width) : 20;
  const linkOpacity = config.link_opacity ? Number(config.link_opacity) : 0.5;

  useEffect(() => {
    // Signal rendering complete
    const timer = setTimeout(() => {
        onRenderComplete?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [data, config, onRenderComplete]);

  if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
      const dimCount = queryResponse.fields.dimensions ? queryResponse.fields.dimensions.length : 0;
      const measCount = queryResponse.fields.measures ? queryResponse.fields.measures.length : 0;
      return (
        <div style={{ padding: '20px', color: '#555', fontFamily: 'inherit' }}>
            <h4>No Sankey Flow Data</h4>
            <p>Please ensure your query has:</p>
            <ul>
                <li>At least 2 dimensions (to establish a flow, e.g. Source to Target)</li>
                <li>At least 1 measure (for link width)</li>
            </ul>
            <p>Received: {dimCount} dimensions, {measCount} measures.</p>
        </div>
      );
  }

  const path = sankeyLinkHorizontal();

  return (
    <div style={{ width: '100%', height: '100%', background: config.background_color || 'transparent', overflow: 'hidden', fontFamily: 'inherit' }}>
      <ParentSize>
        {({ width, height }) => {
            if (width < 10 || height < 10) return null;
            return (
                <Sankey
                    root={sankeyData}
                    nodeWidth={nodeWidth}
                    nodePadding={nodePadding}
                    extent={[[0, 0], [width, height]]}
                >
                    {({ data, graph }: any) => {
                        const { nodes, links } = graph || data;
                        return (
                            <svg width={width} height={height}>
                                <g>
                                {links.map((link: any, i: number) => {
                                    const handleClick = (e: React.MouseEvent) => {
                                        if (link.measureCell && link.measureCell.links) {
                                            LookerCharts.Utils.openDrillMenu({
                                                links: link.measureCell.links,
                                                event: e.nativeEvent
                                            });
                                        }
                                    };

                                    return (
                                        <path
                                            key={`link-${i}`}
                                            d={path(link) || undefined}
                                            stroke={link.source.index !== undefined ? colorScale(nodes[link.source.index].name) : '#999'}
                                            strokeOpacity={linkOpacity}
                                            strokeWidth={Math.max(1, link.width)}
                                            fill="none"
                                            onClick={handleClick}
                                            style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.strokeOpacity = String(Math.min(1, linkOpacity + 0.2)); }}
                                            onMouseLeave={(e) => { e.currentTarget.style.strokeOpacity = String(linkOpacity); }}
                                        >
                                            <title>{`${link.source.name} -> ${link.target.name}\nValue: ${link.value}`}</title>
                                        </path>
                                    );
                                })}
                                {nodes.map((node: any, i: number) => {
                                    const nodeColor = colorScale(node.name);

                                    return (
                                        <g key={`node-${i}`}>
                                            <rect
                                                x={node.x0}
                                                y={node.y0}
                                                width={Math.max(0, node.x1 - node.x0)}
                                                height={Math.max(0, node.y1 - node.y0)}
                                                fill={nodeColor}
                                                fillOpacity={0.8}
                                                stroke="#333"
                                                strokeWidth={0.5}
                                            >
                                                <title>{`${node.name}\nValue: ${node.value}`}</title>
                                            </rect>

                                            <foreignObject
                                                x={node.x0 < width / 2 ? node.x1 + 6 : node.x0 - 206}
                                                y={Math.max(0, (node.y1 + node.y0) / 2 - 10)}
                                                width={200}
                                                height={20}
                                                style={{ overflow: 'visible', pointerEvents: 'none' }}
                                            >
                                                <div style={{
                                                    textAlign: node.x0 < width / 2 ? 'left' : 'right',
                                                    fontSize: '12px',
                                                    fontFamily: 'inherit',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    pointerEvents: 'auto'
                                                }}>
                                                    {node.cell ? (
                                                        <DrillableCell
                                                            cell={node.cell}
                                                            style={{ color: '#333', textDecoration: 'none' }}
                                                        />
                                                    ) : (
                                                        <span>{node.name}</span>
                                                    )}
                                                </div>
                                            </foreignObject>
                                        </g>
                                    );
                                })}
                                </g>
                            </svg>
                        );
                    }}
                </Sankey>
            );
        }}
      </ParentSize>
    </div>
  );
};

export { LookerCustomVizLayout };
