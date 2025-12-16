import React, { useState, useMemo } from "react";
import { Sankey } from "@visx/sankey";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { scaleOrdinal } from "d3-scale";
import { Text } from "@visx/text";
import { Tooltip, useTooltip, defaultStyles } from "@visx/tooltip";
import { SankeyData } from "./utils";
import { format as SSF } from "ssf";

interface SankeyChartProps {
  data: SankeyData;
  width: number;
  height: number;
  config: any;
  lookerCharts: any;
}

const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  width,
  height,
  config,
  lookerCharts,
}) => {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } = useTooltip();
  const [highlighted, setHighlighted] = useState<{ type: 'node' | 'link'; index: number } | null>(null);

  // Parse config options
  const nodeWidth = config.node_width || 10;
  const nodePadding = config.node_padding || 12;
  const linkOpacity = config.link_opacity || 0.4;
  const labelType = config.label_type || 'name';
  const showValuesInTooltip = config.show_tooltip_values !== false;

  // Color scale
  const colorRange = config.color_range || [
    '#dd3333', '#80ce5d', '#f78131', '#369dc1', '#c572d3', '#36c1b3', '#b57052', '#ed69af',
  ];

  // Legacy color logic: strip everything after the first space for color assignment
  const colorScale = useMemo(() => scaleOrdinal(colorRange), [colorRange]);
  const getNodeColor = (name: string) => colorScale(name.split(" ")[0]) as string;

  // Animation style for entrance
  const [show, setShow] = useState(false);
  React.useEffect(() => {
    setShow(true);
  }, []);

  const TooltipAny = Tooltip as any;

  if (width < 10 || height < 10) return null;

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <Sankey
          root={data}
          nodeWidth={nodeWidth}
          nodePadding={nodePadding}
          extent={[
            [1, 1],
            [width - 1, height - 6],
          ]}
          nodeSort={undefined} // Auto sort
        >
          {(sankeyProps) => {
            const { graph } = sankeyProps as any;
            const links = graph.links || [];
            const nodes = graph.nodes || [];

            return (
              <Group>
                {/* Links */}
                <Group>
                  {links.map((link: any, i: number) => {
                    const sourceName = link.source.name;
                    const targetName = link.target.name;
                    const id = `gradient-${i}`;

                    // Determine opacity based on highlight state
                    let currentOpacity = linkOpacity;
                    if (highlighted) {
                      if (highlighted.type === 'link' && highlighted.index === i) {
                        currentOpacity = 0.7;
                      } else if (highlighted.type === 'node') {
                        const isConnected = link.source.index === highlighted.index || link.target.index === highlighted.index;
                        currentOpacity = isConnected ? 0.7 : 0.05;
                      } else {
                        currentOpacity = 0.05;
                      }
                    }

                    return (
                      <React.Fragment key={`link-${i}`}>
                        <LinearGradient
                          id={id}
                          from={getNodeColor(sourceName)}
                          to={getNodeColor(targetName)}
                          vertical={false}
                        />
                        <path
                          d={link.path}
                          stroke={`url(#${id})`}
                          strokeWidth={Math.max(1, link.width)}
                          fill="none"
                          opacity={currentOpacity}
                          style={{ transition: 'opacity 0.2s ease', cursor: link.drillLinks?.length ? 'pointer' : 'default' }}
                          onMouseEnter={(e) => {
                            setHighlighted({ type: 'link', index: i });
                             if (showValuesInTooltip) {
                                showTooltip({
                                  tooltipData: {
                                    text: `${sourceName} → ${targetName}`,
                                    value: link.value
                                  },
                                  tooltipLeft: e.clientX,
                                  tooltipTop: e.clientY,
                                });
                             }
                          }}
                          onMouseMove={(e) => {
                            if (showValuesInTooltip && tooltipOpen) {
                                showTooltip({
                                  tooltipData: tooltipData,
                                  tooltipLeft: e.clientX,
                                  tooltipTop: e.clientY,
                                });
                            }
                          }}
                          onMouseLeave={() => {
                            setHighlighted(null);
                            hideTooltip();
                          }}
                          onClick={(event) => {
                            // Drill menu
                            if (link.drillLinks && link.drillLinks.length > 0) {
                              lookerCharts.Utils.openDrillMenu({
                                links: link.drillLinks,
                                event: event,
                              });
                            }
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </Group>

                {/* Nodes */}
                <Group>
                  {nodes.map((node: any, i: number) => {
                    // Highlight logic
                    let isDimmed = false;
                    if (highlighted) {
                      if (highlighted.type === 'node' && highlighted.index !== i) {
                        isDimmed = true; // Dim other nodes
                      }
                      if (highlighted.type === 'link') {
                         const link = links[highlighted.index];
                         if (link.source.index !== i && link.target.index !== i) {
                           isDimmed = true;
                         }
                      }
                    }

                    const hasDrills = node.drillLinks && node.drillLinks.length > 0;

                    return (
                      <Group key={`node-${i}`} top={node.y0} left={node.x0}>
                        <rect
                          id={`rect-${i}`}
                          width={Math.max(0, node.x1 - node.x0)}
                          height={Math.max(0, node.y1 - node.y0)}
                          fill={getNodeColor(node.name)}
                          stroke="#555"
                          strokeWidth={1} // Add stroke to match old viz
                          opacity={isDimmed ? 0.5 : 1}
                          style={{
                            transition: 'opacity 0.2s ease, height 0.5s ease',
                            transformOrigin: 'top',
                            animation: show ? 'grow 0.8s ease-out' : 'none',
                            cursor: hasDrills ? 'pointer' : 'default'
                          }}
                          onMouseEnter={() => setHighlighted({ type: 'node', index: i })}
                          onMouseLeave={() => setHighlighted(null)}
                          onClick={(event) => {
                             if (hasDrills) {
                               lookerCharts.Utils.openDrillMenu({
                                 links: node.drillLinks,
                                 event: event,
                               });
                             }
                          }}
                        >
                        </rect>
                         <style>{`
                            @keyframes grow {
                              from { transform: scaleY(0); }
                              to { transform: scaleY(1); }
                            }
                          `}</style>
                        <Text
                          x={node.x0 < width / 2 ? 6 + (node.x1 - node.x0) : -6}
                          y={(node.y1 - node.y0) / 2}
                          verticalAnchor="middle"
                          textAnchor={node.x0 < width / 2 ? "start" : "end"}
                          fontSize={10}
                          fontWeight="bold"
                          fill="#222"
                          style={{ pointerEvents: 'none' }} // Let clicks pass through to rect
                        >
                           {labelType === 'name_value' ? `${node.name} (${node.value})` : node.name}
                        </Text>
                      </Group>
                    );
                  })}
                </Group>
              </Group>
            );
          }}
        </Sankey>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipAny top={tooltipTop} left={tooltipLeft} style={defaultStyles}>
          <div style={{ color: 'black' }}>
            <strong>{(tooltipData as any).text}</strong>
            <br />
            Value: {(tooltipData as any).value}
          </div>
        </TooltipAny>
      )}
    </div>
  );
};

export default SankeyChart;
