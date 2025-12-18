import React, { useMemo } from 'react';
import { Sankey } from '@visx/sankey';
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { scaleOrdinal } from '@visx/scale';
import { sankeyLinkHorizontal } from 'd3-sankey';
import { processData } from '../utils';
import { VisConfig } from '../types';
import styled from 'styled-components';

interface ModernSankeyProps {
  data: any[];
  config: VisConfig;
  queryResponse: any;
  width: number;
  height: number;
  lookerCharts: any;
}

const TooltipContainer = styled.div`
  position: absolute;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.2s;
`;

export const ModernSankey: React.FC<ModernSankeyProps> = ({
  data,
  config,
  queryResponse,
  width,
  height,
  lookerCharts,
}) => {
  const { nodes, links } = useMemo(
    () => processData(data, queryResponse, config),
    [data, queryResponse, config]
  );

  const colorScale = useMemo(() => {
    return scaleOrdinal({
      domain: nodes.map((n) => n.name),
      range: config.color_range || ['#dd3333', '#80ce5d', '#f78131', '#369dc1'],
    });
  }, [nodes, config.color_range]);

  if (width < 10 || height < 10) return null;

  // Defaults
  const nodeWidth = config.node_width || 15;
  const nodePadding = config.node_padding || 10;
  const linkOpacity = config.link_opacity || 0.5;
  const fontSize = config.font_size || 12;

  // Tooltip state (simple implementation)
  const [tooltip, setTooltip] = React.useState({ show: false, x: 0, y: 0, content: '' });

  const pathGenerator = sankeyLinkHorizontal();

  return (
    <>
        <svg width={width} height={height}>
          <Sankey
            root={{ nodes, links }}
            nodeWidth={nodeWidth}
            nodePadding={nodePadding}
            extent={[
              [1, 1],
              [width - 1, height - 6],
            ]}
          >
            {({ data }) => {
              if (!data || !data.nodes) return null;
              return (
              <Group>
                {data.nodes.map((node, i) => (
                  <Group top={node.y0} left={node.x0} key={`node-${i}`}>
                    <rect
                      id={`rect-${i}`}
                      width={node.x1 - node.x0}
                      height={Math.max(0, node.y1 - node.y0)}
                      fill={colorScale(node.name)}
                      opacity={0.8}
                      stroke="black"
                      strokeWidth={config.node_border_width || 0}
                      onMouseEnter={(e) => {
                         setTooltip({
                             show: true,
                             x: e.clientX,
                             y: e.clientY,
                             content: `${node.name}\nValue: ${node.value}`
                         });
                      }}
                      onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                    />
                    <Text
                      x={node.x0 < width / 2 ? (node.x1 - node.x0) + 6 : -6}
                      y={(node.y1 - node.y0) / 2}
                      dy=".33em"
                      fontSize={fontSize}
                      textAnchor={node.x0 < width / 2 ? 'start' : 'end'}
                      fill={config.label_type === 'name_value' ? '#333' : '#222'}
                      fontWeight="bold"
                    >
                      {config.label_type === 'name_value'
                        ? `${node.name} (${node.value})`
                        : node.name}
                    </Text>
                  </Group>
                ))}
                {data.links.map((link, i) => (
                  <path
                    key={`link-${i}`}
                    d={pathGenerator(link as any) || undefined}
                    stroke={
                        typeof link.source === 'object' && 'name' in link.source
                        ? colorScale((link.source as any).name)
                        : '#ccc'
                    }
                    strokeWidth={Math.max(1, link.width)}
                    opacity={linkOpacity}
                    fill="none"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                       setTooltip({
                             show: true,
                             x: e.clientX,
                             y: e.clientY,
                             content: `${(link.source as any).name} → ${(link.target as any).name}\nValue: ${link.value}`
                         });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = String(linkOpacity);
                      setTooltip({ ...tooltip, show: false });
                    }}
                    onClick={(event) => {
                         if (lookerCharts && lookerCharts.Utils) {
                             lookerCharts.Utils.openDrillMenu({
                                 links: (link as any).drillLinks || [],
                                 event: event.nativeEvent,
                             });
                         }
                    }}
                    style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                  />
                ))}
              </Group>
            );}}
          </Sankey>
        </svg>
        {tooltip.show && (
            <TooltipContainer style={{ left: tooltip.x + 10, top: tooltip.y + 10, opacity: 1 }}>
                <pre style={{ margin: 0 }}>{tooltip.content}</pre>
            </TooltipContainer>
        )}
    </>
  );
};
