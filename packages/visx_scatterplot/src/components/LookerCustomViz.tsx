import React, { useMemo, useState, useEffect } from "react";
import { useViz } from "./VizContext";
import { DrillableCell } from "./DrillableCell";
import { ParentSize } from "@visx/responsive";
import { Zoom } from "@visx/zoom";
import { localPoint } from "@visx/event";
import { scaleLinear, scaleTime, scaleOrdinal } from "@visx/scale";
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { LegendOrdinal } from "@visx/legend";
import { Cell, PivotCell, VisData, VisQueryResponse } from "../types";

// Helper type for our internal point structure
interface ScatterPoint {
  x: number | Date;
  y: number;
  color: string;
  cell: Cell;
  xCell: Cell;
  id: string; // unique key
}

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, onRenderComplete, queryResponse } = useViz();

  useEffect(() => {
    // Call onRenderComplete when rendering finishes
    const timer = setTimeout(() => {
        onRenderComplete?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [data, config, onRenderComplete]);

  if (!config || !data || data.length === 0 || !queryResponse) {
    return <div style={{ padding: 20 }}>No data to display</div>;
  }

  const bg = config.background_color || "transparent";

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: bg, fontFamily: 'sans-serif' }}>
      <ParentSize>
        {({ width, height }) => (
          <ScatterPlot
            width={width}
            height={height}
            data={data}
            queryResponse={queryResponse}
          />
        )}
      </ParentSize>
    </div>
  );
};

interface ScatterPlotProps {
  width: number;
  height: number;
  data: VisData;
  queryResponse: VisQueryResponse;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  width,
  height,
  data,
  queryResponse,
}) => {
  const margin = { top: 40, right: 30, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Process Data
  const { points, xType, xLabel, yLabel, colorScale, seriesLabels } = useMemo(() => {
    const defaultScale = scaleOrdinal({ domain: ["default"], range: ["#ccc"] });
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;
    const pivots = queryResponse.pivots;

    if (!dimensions || dimensions.length === 0 || !measures || measures.length === 0) {
      return { points: [], xType: "category", xLabel: "", yLabel: "", colorScale: defaultScale, seriesLabels: [] };
    }

    const xDim = dimensions[0];
    const yMeasure = measures[0];
    const xName = xDim.name;
    const yName = yMeasure.name;

    // Determine if X is date
    const isDate = xDim.type.includes("date") || xDim.type.includes("time");

    let processedPoints: ScatterPoint[] = [];
    const seriesKeys = new Set<string>();

    data.forEach((row, i) => {
      const xCell = row[xName] as Cell;
      let xVal: any = xCell.value;

      if (isDate && xVal) {
        xVal = new Date(xVal);
      }

      if (pivots && pivots.length > 0) {
        // Pivoted Data
        // row[yName] should be a PivotCell
        const pivotCell = row[yName] as PivotCell;

        // Sometimes pivotCell might be undefined or not an object if data is missing, handle gracefully
        if (pivotCell && typeof pivotCell === 'object') {
            pivots.forEach((pivot) => {
            const pivotKey = pivot.key;
            if (pivotCell[pivotKey]) {
                const yCell = pivotCell[pivotKey];
                const yVal = yCell.value;
                if (yVal !== null && yVal !== undefined) {
                    seriesKeys.add(pivotKey);
                    processedPoints.push({
                        x: xVal,
                        y: Number(yVal),
                        color: pivotKey,
                        cell: yCell,
                        xCell: xCell,
                        id: `${i}-${pivotKey}`
                    });
                }
            }
            });
        }
      } else {
        // Flat Data
        const yCell = row[yName] as Cell;
        if (yCell) {
            const yVal = yCell.value;
            if (yVal !== null && yVal !== undefined) {
                processedPoints.push({
                    x: xVal,
                    y: Number(yVal),
                    color: "default",
                    cell: yCell,
                    xCell: xCell,
                    id: `${i}`
                });
            }
        }
      }
    });

    // Create Color Scale
    const domain = Array.from(seriesKeys);
    // Standard colors similar to screenshot (pinks/reds/oranges)
    const range = pivots && pivots.length > 0
        ? ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf"] // Set 1 like
        : ["#fa4659"]; // Single color for non-pivoted

    const customColors = ["#EF5350", "#EC407A", "#AB47BC", "#7E57C2", "#5C6BC0", "#42A5F5", "#29B6F6", "#26C6DA", "#26A69A", "#66BB6A", "#9CCC65", "#D4E157", "#FFEE58", "#FFCA28", "#FFA726", "#FF7043", "#8D6E63", "#BDBDBD", "#78909C"];

    const scale = scaleOrdinal({
        domain: domain.length > 0 ? domain : ["default"],
        range: domain.length > 0 ? customColors : ["#ff6b6b"]
    });

    return {
      points: processedPoints,
      xType: isDate ? "time" : "category",
      xLabel: xDim.label_short || xDim.label || xDim.name,
      yLabel: yMeasure.label_short || yMeasure.label || yMeasure.name,
      colorScale: scale,
      seriesLabels: domain
    };
  }, [data, queryResponse]);

  // Scales
  const xScale = useMemo(() => {
    if (xType === "time") {
        return scaleTime({
            range: [0, innerWidth],
            domain: [
                Math.min(...points.map((p) => (p.x as Date).getTime())),
                Math.max(...points.map((p) => (p.x as Date).getTime())),
            ],
        });
    } else {
        const isNum = points.length > 0 && typeof points[0].x === 'number';
        if (isNum) {
            return scaleLinear({
                range: [0, innerWidth],
                domain: [Math.min(...points.map(p => p.x as number)), Math.max(...points.map(p => p.x as number))]
            })
        }
        return scaleLinear({ range: [0, innerWidth], domain: [0, 100] });
    }
  }, [points, innerWidth, xType]);

  const yScale = useMemo(() => {
    const yMin = Math.min(...points.map((p) => p.y));
    const yMax = Math.max(...points.map((p) => p.y));
    // Add some padding
    const padding = (yMax - yMin) * 0.1;
    return scaleLinear({
      range: [innerHeight, 0],
      domain: [yMin - padding, yMax + padding],
    });
  }, [points, innerHeight]);


  if (width < 10) return null;

  // Fix for React 18 JSX type issue with Zoom
  const ZoomAny = Zoom as any;

  return (
    <div style={{ position: "relative" }}>
        {seriesLabels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10, paddingLeft: margin.left }}>
                <LegendOrdinal scale={colorScale} direction="row" labelFormat={label => label} itemMargin="0 15px 0 0" />
            </div>
        )}
        <ZoomAny
            width={width}
            height={height}
            scaleXMin={1 / 2}
            scaleXMax={4}
            scaleYMin={1 / 2}
            scaleYMax={4}
            initialTransformMatrix={{
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: 0,
                skewX: 0,
                skewY: 0,
            }}
        >
        {(zoom: any) => (
            <svg
                width={width}
                height={height}
                style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: 'none' }}
                ref={zoom.containerRef}
            >
                {/* Background for zoom capture */}
                <rect width={width} height={height} fill="transparent" onTouchStart={zoom.dragStart} onMouseDown={zoom.dragStart} />

                <Group left={margin.left} top={margin.top}>
                    {(() => {
                        const t = zoom.transformMatrix;
                        return (
                            <Group transform={zoom.toString()}>
                                <AxisBottom scale={xScale} top={innerHeight} label={xLabel} stroke="#333" tickStroke="#333" />
                                <AxisLeft scale={yScale} label={yLabel} stroke="#333" tickStroke="#333" />

                                <Group>
                                    {points.map((point) => {
                                        const cx = xScale(point.x as any);
                                        const cy = yScale(point.y);
                                        const color = colorScale(point.color);
                                        const r = 6;

                                        const adjustedR = r / t.scaleX; // approximate

                                        return (
                                            <foreignObject
                                                key={point.id}
                                                x={cx - adjustedR}
                                                y={cy - adjustedR}
                                                width={adjustedR * 2}
                                                height={adjustedR * 2}
                                                style={{ overflow: 'visible' }}
                                            >
                                                <DrillableCell
                                                    cell={point.cell}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textIndent: '-9999px',
                                                        cursor: 'pointer',
                                                        border: '1px solid rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </foreignObject>
                                        );
                                    })}
                                </Group>
                            </Group>
                        );
                    })()}
                </Group>
            </svg>
        )}
        </ZoomAny>
    </div>
  );
};

export { LookerCustomVizLayout };
