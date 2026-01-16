import React, { useMemo, useState, useEffect } from 'react';
import { useViz } from './VizContext';
import { ParentSize } from '@visx/responsive';
import { Zoom } from '@visx/zoom';
import { localPoint } from '@visx/event';
import { Bar as Rect, Circle } from '@visx/shape';
import { scaleLinear, scaleTime, scaleOrdinal } from '@visx/scale';
import { ScaleLinear, ScaleTime } from 'd3-scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Tooltip, TooltipWithBounds, useTooltip, defaultStyles } from '@visx/tooltip';
import { extent, max, min } from 'd3-array';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

// Modern Neon Palette
const NEON_PALETTE = [
  '#00BCD4', // Cyan
  '#FF4081', // Pink
  '#76FF03', // Lime
  '#FFFF00', // Yellow
  '#E040FB', // Purple
  '#FF6D00', // Orange
];

export const LookerCustomVizLayout = () => {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <ParentSize>
        {({ width, height }) => <Scatterplot width={width} height={height} />}
      </ParentSize>
    </div>
  );
};

interface Point {
  x: number | Date;
  y: number;
  r: number;
  color: string;
  label: string;
  series: string;
  origX: any;
}

const Scatterplot = ({ width, height }: { width: number; height: number }) => {
  const { data, config, queryResponse, onRenderComplete } = useViz();
  const { showTooltip, hideTooltip, tooltipData, tooltipOpen, tooltipLeft, tooltipTop } = useTooltip<Point>();

  // 1. Parse Config
  const bgColor = config.background_color || '#000000';
  const gridColor = config.grid_color || 'rgba(255, 255, 255, 0.1)';
  const labelColor = config.label_color || '#FFFFFF';
  const pointRadius = Number(config.point_radius) || 5;

  // 2. Data Processing
  const { points, xType, xLabel, yLabel, xField, yField } = useMemo(() => {
    const dimensions = queryResponse.fields.dimensions || [];
    const measures = queryResponse.fields.measures || [];
    const pivots = queryResponse.pivots || [];

    const xField = dimensions[0];
    const yField = measures[0]; // Primary measure

    let processedPoints: Point[] = [];
    let isDate = false;

    if (!xField || !yField) {
      return { points: [], xType: 'number', xLabel: '', yLabel: '', xField: null, yField: null };
    }

    if (xField.is_time || xField.type?.includes('date') || xField.type?.includes('time')) {
        isDate = true;
    }

    // Color Scale for Series
    const seriesKeys = pivots.length > 0 ? pivots.map(p => p.key) : ['default'];
    const colorScale = scaleOrdinal({
        domain: seriesKeys,
        range: NEON_PALETTE
    });

    data.forEach((row: any, i: number) => {
        // X Value
        let rawX = row[xField.name]?.value;
        let parsedX: number | Date = i; // fallback

        if (isDate) {
            parsedX = new Date(rawX);
        } else if (typeof rawX === 'number') {
            parsedX = rawX;
        } else {
            const floatX = parseFloat(rawX);
            parsedX = isNaN(floatX) ? i : floatX;
        }

        // Y Value(s)
        if (pivots.length > 0) {
            pivots.forEach(pivot => {
                const measureCell = row[yField.name]?.[pivot.key];
                if (measureCell) {
                    const val = measureCell.value;
                    if (val !== null && val !== undefined) {
                        processedPoints.push({
                            x: parsedX,
                            y: Number(val),
                            r: pointRadius,
                            color: colorScale(pivot.key) as string,
                            label: `${xField.label_short || xField.label}: ${measureCell.rendered || val}`,
                            series: pivot.key,
                            origX: rawX
                        });
                    }
                }
            });
        } else {
            // Flat
            const measureCell = row[yField.name];
            if (measureCell) {
                const val = measureCell.value;
                if (val !== null && val !== undefined) {
                     processedPoints.push({
                        x: parsedX,
                        y: Number(val),
                        r: pointRadius,
                        color: NEON_PALETTE[0],
                        label: `${xField.label_short || xField.label}: ${measureCell.rendered || val}`,
                        series: yField.label,
                        origX: rawX
                    });
                }
            }
        }
    });

    return {
        points: processedPoints,
        xType: isDate ? 'date' : 'number',
        xLabel: xField.label_short || xField.label,
        yLabel: yField.label_short || yField.label,
        xField,
        yField
    };
  }, [data, queryResponse, pointRadius]);


  // 3. Scales
  const xScale = useMemo(() => {
    if (xType === 'date') {
        const xValues = points.map(p => p.x as Date);
        return scaleTime({
            range: [0, width],
            domain: extent(xValues) as [Date, Date],
        });
    } else {
        const xValues = points.map(p => p.x as number);
        return scaleLinear({
            range: [0, width],
            domain: extent(xValues) as [number, number],
            nice: true,
        });
    }
  }, [points, width, xType]);

  const yScale = useMemo(() => {
    const yValues = points.map(p => p.y);
    return scaleLinear({
        range: [height, 0], // SVG y is down
        domain: [min(yValues) || 0, max(yValues) || 0],
        nice: true,
    });
  }, [points, height]);


  // Trigger Done
  useEffect(() => {
    if (onRenderComplete) onRenderComplete();
  }, [onRenderComplete]);

  if (points.length === 0) return <div style={{color: labelColor}}>No Data</div>;

  const initialTransform = {
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
      skewX: 0,
      skewY: 0,
  };

  return (
    <>
      {/* @ts-ignore */}
      <Zoom
        width={width}
        height={height}
        scaleXMin={1 / 2}
        scaleXMax={4}
        scaleYMin={1 / 2}
        scaleYMax={4}
        initialTransformMatrix={initialTransform}
      >
        {(zoom: any) => {
            const onDragStart = (e: any) => {
                zoom.dragStart(e);
            }

            // Use standard Visx rescale if easier, but keeping manual domain mapping for precision control
            // Actually, let's use the provided rescaleX/Y for Axes which is simpler
            const rescaledX = zoom.transform.rescaleX(xScale);
            const rescaledY = zoom.transform.rescaleY(yScale);

            return (
                <div style={{ position: 'relative' }}>
                    <svg
                        width={width}
                        height={height}
                        style={{ cursor: zoom.isDragging ? 'grabbing' : 'grab', background: bgColor }}
                    >
                        <Rect
                            width={width}
                            height={height}
                            fill={bgColor}
                            onTouchStart={zoom.dragStart}
                            onMouseDown={zoom.dragStart}
                            onDoubleClick={(event: any) => {
                                const point = localPoint(event) || { x: 0, y: 0 };
                                zoom.scale({ scaleX: 1.1, scaleY: 1.1, point });
                            }}
                        />

                        <GridRows
                            scale={rescaledY}
                            width={width}
                            stroke={gridColor}
                            strokeOpacity={0.5}
                        />
                        <GridColumns
                            scale={rescaledX}
                            height={height}
                            stroke={gridColor}
                            strokeOpacity={0.5}
                        />

                        {/* Axes */}
                        <AxisBottom
                            top={height - 30}
                            scale={rescaledX}
                            stroke={labelColor}
                            tickStroke={labelColor}
                            tickLabelProps={() => ({
                                fill: labelColor,
                                fontSize: 11,
                                textAnchor: 'middle',
                            })}
                            numTicks={width > 500 ? 10 : 5}
                        />
                        <AxisLeft
                            left={50}
                            scale={rescaledY}
                            stroke={labelColor}
                            tickStroke={labelColor}
                            tickLabelProps={() => ({
                                fill: labelColor,
                                fontSize: 11,
                                textAnchor: 'end',
                                dx: -5,
                                dy: 4,
                            })}
                        />

                        {/* Data Points */}
                        {points.map((point: Point, i: number) => {
                            const cx = rescaledX(point.x);
                            const cy = rescaledY(point.y);

                            return (
                                <Circle
                                    key={i}
                                    cx={cx}
                                    cy={cy}
                                    r={point.r / zoom.transform.scaleX < 2 ? 2 : point.r}
                                    fill={point.color}
                                    fillOpacity={0.8}
                                    stroke="#fff"
                                    strokeWidth={1}
                                    strokeOpacity={0.2}
                                    onMouseEnter={(e) => {
                                        showTooltip({
                                            tooltipData: point,
                                            tooltipLeft: cx,
                                            tooltipTop: cy,
                                        });
                                    }}
                                    onMouseLeave={() => hideTooltip()}
                                />
                            );
                        })}
                    </svg>

                    {tooltipOpen && tooltipData && (
                        /* @ts-ignore */
                        <TooltipWithBounds
                            key={Math.random()}
                            top={tooltipTop}
                            left={tooltipLeft}
                            style={{
                                ...defaultStyles,
                                backgroundColor: '#222',
                                color: '#fff',
                                border: '1px solid #555'
                            }}
                        >
                            <div style={{ fontWeight: 'bold' }}>{tooltipData.series}</div>
                            <div>
                                {xLabel}: {
                                    tooltipData.origX instanceof Date
                                    ? timeFormat('%b %d, %Y')(tooltipData.origX)
                                    : String(tooltipData.origX)
                                }
                            </div>
                            <div>{yLabel}: {format(',')(tooltipData.y)}</div>
                        </TooltipWithBounds>
                    )}
                </div>
            );
        }}
      </Zoom>
    </>
  );
};
