import React, { useEffect, useMemo } from 'react'
import { useViz } from './VizContext';
import { DrillableCell } from './DrillableCell';
import { AreaClosed, LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
import { ParentSize } from '@visx/responsive';
import { extent, max, min } from 'd3-array';

// Format helper
const formatPercent = (val: number) => `${(val * 100).toFixed(2)}%`;

interface SparklineProps {
    width: number;
    height: number;
    data: any[];
    color: string;
}

const Sparkline: React.FC<SparklineProps> = ({ width, height, data, color }) => {
    if (width < 10) return null;

    const getX = (d: any) => d.date;
    const getY = (d: any) => d.value;

    const xScale = scaleTime({
        range: [0, width],
        domain: extent(data, getX) as [Date, Date],
    });

    const yScale = scaleLinear({
        range: [height, 0],
        domain: [min(data, getY) || 0, max(data, getY) || 0],
        nice: true,
    });

    const gradientId = `area-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={width} height={height}>
            <LinearGradient id={gradientId} from={color} to={color} fromOpacity={0.4} toOpacity={0} />
            <AreaClosed
                data={data}
                x={d => xScale(getX(d)) ?? 0}
                y={d => yScale(getY(d)) ?? 0}
                yScale={yScale}
                strokeWidth={0}
                fill={`url(#${gradientId})`}
                curve={curveMonotoneX}
            />
            <LinePath
                data={data}
                x={d => xScale(getX(d)) ?? 0}
                y={d => yScale(getY(d)) ?? 0}
                stroke={color}
                strokeWidth={2}
                curve={curveMonotoneX}
            />
        </svg>
    );
};

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, queryResponse, onRenderComplete } = useViz();

  useEffect(() => {
    onRenderComplete?.();
  }, [data, config, onRenderComplete]);

  const processedData = useMemo(() => {
      if (!queryResponse || !queryResponse.fields || !queryResponse.fields.dimensions || queryResponse.fields.dimensions.length < 2) {
          return null;
      }
      const dims = queryResponse.fields.dimensions;
      const measures = queryResponse.fields.measures;

      // We need at least 2 dimensions: Date and Grouping
      const dateDim = dims[0];
      const groupDim = dims[1];
      const imageDim = dims.length > 2 ? dims[2] : null;

      // We need at least 1 measure
      if (measures.length === 0) return null;
      const measure = measures[0];

      const groups = new Map();

      data.forEach(row => {
          const groupKey = row[groupDim.name].value;
          if (!groups.has(groupKey)) {
              groups.set(groupKey, {
                  key: groupKey,
                  labelCell: row[groupDim.name],
                  imageCell: imageDim ? row[imageDim.name] : null,
                  measureName: measure.name,
                  data: []
              });
          }

          let val = row[measure.name].value;
          if (val === null || val === undefined) val = 0; // Handle nulls

          groups.get(groupKey).data.push({
              date: new Date(row[dateDim.name].value),
              value: Number(val),
              row: row // Keep ref to full row for last point
          });
      });

      const result: any[] = [];
      groups.forEach((group) => {
          // Sort by date
          group.data.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

          const len = group.data.length;
          const current = len > 0 ? group.data[len - 1] : null;
          const previous = len > 1 ? group.data[len - 2] : (len > 0 ? group.data[0] : null);

          let change = 0;
          if (current && previous && previous.value !== 0) {
              change = (current.value - previous.value) / previous.value;
          }

          result.push({
              ...group,
              current,
              change
          });
      });

      return result;

  }, [data, queryResponse]);

  if (!processedData) {
      return (
        <div style={{ padding: '20px' }}>
            <h3>Configuration Error</h3>
            <p>Please ensure your query has:</p>
            <ul>
                <li>At least 2 dimensions (Date, Grouping)</li>
                <li>At least 1 measure (Value)</li>
            </ul>
        </div>
      );
  }

  const lineColor = config.line_color || '#ff7f0e';
  const upColor = config.up_color || '#2ca02c';
  const downColor = config.down_color || '#d62728';

  return (
    <div className="viz-container" style={{ fontFamily: 'sans-serif', padding: '10px' }}>
        {processedData.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', overflow: 'hidden', flexShrink: 0 }}>
                        {item.imageCell && item.imageCell.value ? (
                            <img src={item.imageCell.value} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                             // Default logo placeholder
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                             </svg>
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <DrillableCell cell={item.labelCell} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                             {item.current && (
                                 <DrillableCell cell={item.current.row[item.measureName]} />
                             )}
                        </div>
                        <div style={{ color: item.change >= 0 ? upColor : downColor, fontSize: '14px' }}>
                            {item.change >= 0 ? '+' : ''}{formatPercent(item.change)}
                        </div>
                    </div>
                </div>
                <div style={{ height: '60px', width: '100%' }}>
                    <ParentSize>
                        {({ width, height }) => (
                            <Sparkline width={width} height={height} data={item.data} color={lineColor} />
                        )}
                    </ParentSize>
                </div>
            </div>
        ))}
    </div>
  );
};

export { LookerCustomVizLayout };
