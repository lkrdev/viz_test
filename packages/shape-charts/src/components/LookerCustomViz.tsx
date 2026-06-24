import React, { useEffect, useMemo } from 'react';
import { useViz } from './VizContext';
import { Cell } from '../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SHAPES = ['circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'] as const;
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, onRenderComplete } = useViz();

  useEffect(() => {
    // We add a small timeout to ensure recharts renders before we signal completion
    const timer = setTimeout(() => {
      onRenderComplete?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [data, config, onRenderComplete]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { groupedData: {} as Record<string, any[]>, xKey: '', yKey: '' };

    const headers = Object.keys(data[0]);
    if (headers.length < 2) return { groupedData: {} as Record<string, any[]>, xKey: '', yKey: '' };

    // Extract fields to use based on available columns
    const xKey = headers[0];
    const yKey = headers[1];
    const shapeKey = headers.length > 2 ? headers[2] : null;

    const groupedData: Record<string, any[]> = {};

    data.forEach((row) => {
        const shapeValue = shapeKey ? String((row[shapeKey] as Cell).value) : 'default';
        const xValue = (row[xKey] as Cell).value;
        const yValue = (row[yKey] as Cell).value;

        if (!groupedData[shapeValue]) {
            groupedData[shapeValue] = [];
        }

        groupedData[shapeValue].push({
            x: isNaN(Number(xValue)) ? xValue : Number(xValue),
            y: isNaN(Number(yValue)) ? yValue : Number(yValue),
            originalRow: row
        });
    });

    return { groupedData, xKey, yKey, shapeKey };
  }, [data]);

  if (!config || !data) {
    return <div>Loading...</div>;
  }

  if (data.length === 0 || !chartData.xKey) {
    return <div className="data-preview">No data available or insufficient columns (need at least 2).</div>;
  }

  const seriesKeys = Object.keys(chartData.groupedData);

  return (
    <div className="viz-container" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>{config.title_text || 'Shape Chart'}</h1>
        <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    {/* Using category for X if string, number for X if number */}
                    <XAxis
                        dataKey="x"
                        name={chartData.xKey}
                        type={typeof (chartData.groupedData as Record<string, any[]>)[seriesKeys[0]]?.[0]?.x === 'number' ? 'number' : 'category'}
                        allowDuplicatedCategory={false}
                    />
                    <YAxis
                        dataKey="y"
                        name={chartData.yKey}
                        type="number"
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    {seriesKeys.map((key, index) => {
                        const shape = SHAPES[index % SHAPES.length];
                        const color = COLORS[index % COLORS.length];
                        return (
                            <Scatter
                                key={key}
                                name={key === 'default' ? 'Data' : key}
                                data={(chartData.groupedData as Record<string, any[]>)[key]}
                                fill={color}
                                shape={shape}
                            />
                        );
                    })}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export { LookerCustomVizLayout };
