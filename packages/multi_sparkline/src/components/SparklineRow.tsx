import React, { useMemo } from 'react';
import { SparklineGroup } from '../utils';
import { DrillableCell } from './DrillableCell';
import { Group } from '@visx/group';
import { AreaClosed } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';
import { max, extent } from 'd3-array';

interface SparklineRowProps {
  group: SparklineGroup;
}

const Chart = ({ group, width, height }: { group: SparklineGroup, width: number, height: number }) => {
  if (width < 10) return null;

  // Scales
  const xScale = useMemo(() => scaleTime({
    range: [0, width],
    domain: extent(group.data, d => d.date) as [Date, Date],
  }), [width, group.data]);

  const yScale = useMemo(() => scaleLinear({
    range: [height, 0],
    domain: [
      0,
      (max(group.data, d => d.value) || 0) * 1.1, // Padding
    ],
  }), [height, group.data]);

  return (
    <svg width={width} height={height}>
      <LinearGradient id={`gradient-${group.id}`} from="#24b27c" to="#24b27c" fromOpacity={0.4} toOpacity={0.05} />
      <Group>
        <AreaClosed
          data={group.data}
          x={d => xScale(d.date)}
          y={d => yScale(d.value)}
          yScale={yScale}
          curve={curveMonotoneX}
          stroke="#24b27c"
          strokeWidth={2}
          fill={`url(#gradient-${group.id})`}
        />
      </Group>
    </svg>
  );
};

export const SparklineRow: React.FC<SparklineRowProps> = ({ group }) => {
  const { labelCell1, labelCell2, valueCell, change, percentChange } = group;

  const changeColor = change >= 0 ? '#24b27c' : '#cb3241'; // Green : Red
  const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${(percentChange * 100).toFixed(2)}%)`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '15px 0' }}>
      {/* Left: Labels */}
      <div style={{ width: '250px', flexShrink: 0, paddingRight: '20px' }}>
         <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <DrillableCell cell={labelCell1} />
         </div>
         {labelCell2 && (
             <div style={{ color: '#666', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <DrillableCell cell={labelCell2} />
             </div>
         )}
      </div>

      {/* Center: Chart */}
      <div style={{ flexGrow: 1, height: '80px', marginRight: '20px' }}>
        <ParentSize>
          {({ width, height }) => <Chart group={group} width={width} height={height} />}
        </ParentSize>
      </div>

      {/* Right: Value + Change */}
      <div style={{ width: '150px', flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>
            <DrillableCell cell={valueCell} />
        </div>
        <div style={{ color: changeColor, fontSize: '14px' }}>
            {changeText}
        </div>
      </div>
    </div>
  );
};
