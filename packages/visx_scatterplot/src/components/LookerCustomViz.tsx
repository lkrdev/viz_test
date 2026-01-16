import React, { useEffect, useMemo } from "react";
import { useViz } from "./VizContext";
import { scaleLinear, scaleBand, scaleTime } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { Zoom } from "@visx/zoom";
import { RectClipPath } from "@visx/clip-path";
import { useCrossFilter } from "../hooks/useCrossFilter";

// Fix for TS2786: 'Zoom' cannot be used as a JSX component.
const ZoomAny = Zoom as any;

const neonColors = [
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFFF00", // Yellow
  "#FF0000", // Red
  "#00FF00", // Lime
  "#0000FF", // Blue
  "#FF9900", // Orange
  "#CC00FF", // Purple
];

const LookerCustomVizLayout: React.FC = () => {
  const { config } = useViz();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: config.background_color || "#000000",
        color: "#ffffff",
        position: "relative",
      }}
    >
      <ParentSize>
        {({ width, height }) => <ScatterPlot width={width} height={height} />}
      </ParentSize>
    </div>
  );
};

const ScatterPlot = ({ width, height }: { width: number; height: number }) => {
  const { data, config, onRenderComplete, dimensions, measures, pivots } = useViz();
  const margin = { top: 40, right: 30, bottom: 50, left: 60 };

  useEffect(() => {
    onRenderComplete?.();
  }, [data, config, onRenderComplete]);

  const { points, xKey, yKey, seriesKeys, xType } = useMemo(() => {
    if (!data || data.length === 0) return { points: [], xKey: "", yKey: "", seriesKeys: [], xType: "category" };

    const firstDim = dimensions[0];
    const firstMeas = measures[0];
    const xKey = firstDim.name;
    const yKey = firstMeas.name;
    const seriesKeys: string[] = pivots && pivots.length > 0 ? pivots.map((p) => p.key) : ["default"];

    let xType = "category";
    // @ts-ignore
    if (firstDim.is_numeric) xType = "numeric";
    // @ts-ignore
    if (firstDim.is_timeframe) xType = "time";

    const points: any[] = [];
    data.forEach((d) => {
      if (pivots && pivots.length > 0) {
        pivots.forEach((pivot) => {
          const valObj = d[firstMeas.name];
          const val = valObj && valObj[pivot.key] ? valObj[pivot.key].value : null;

          if (val !== null) {
            let xVal = d[firstDim.name].value;
            if (xType === "time") {
                xVal = new Date(xVal);
            }
            points.push({
              x: xVal,
              y: val,
              series: pivot.key,
              row: d,
              pivot: pivot,
            });
          }
        });
      } else {
        let xVal = d[firstDim.name].value;
        if (xType === "time") {
            xVal = new Date(xVal);
        }
        points.push({
          x: xVal,
          y: d[firstMeas.name].value,
          series: "default",
          row: d,
          pivot: null,
        });
      }
    });

    return { points, xKey, yKey, seriesKeys, xType };
  }, [data, dimensions, measures, pivots]);

  // Scales
  let xScale: any;
  if (xType === "numeric") {
    const xValues = points.map((p) => p.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    xScale = scaleLinear({
      domain: [minX, maxX],
      range: [margin.left, width - margin.right],
    });
  } else if (xType === "time") {
    const xValues = points.map((p) => p.x);
    // Sort dates to ensure domain is correct
    const sortedDates = xValues.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    const minX = sortedDates[0];
    const maxX = sortedDates[sortedDates.length - 1];

    xScale = scaleTime({
        domain: [minX, maxX],
        range: [margin.left, width - margin.right],
    });
  } else {
    // Deduplicate xValues for categorical scale
    const xValues = Array.from(new Set(points.map((p) => p.x)));
    xScale = scaleBand({
      domain: xValues,
      range: [margin.left, width - margin.right],
      padding: 0.5,
    });
  }

  // Y Scale
  const yValues = points.map((p) => p.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const yScale = scaleLinear({
    domain: [minY, maxY],
    range: [height - margin.bottom, margin.top],
    nice: true,
  });

  if (!data || width < 10 || height < 10) return <div>Loading...</div>;

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return (
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
          <div className="relative">
            <svg
              width={width}
              height={height}
              style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
              ref={zoom.containerRef}
            >
              <RectClipPath id="zoom-clip" x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} />

              <rect
                width={width}
                height={height}
                rx={14}
                fill={config.background_color || "#000000"}
                onMouseDown={zoom.dragStart}
                onMouseMove={zoom.dragMove}
                onMouseUp={zoom.dragEnd}
                onMouseLeave={() => {
                  if (zoom.isDragging) zoom.dragEnd();
                }}
                onTouchStart={zoom.dragStart}
                onTouchMove={zoom.dragMove}
                onTouchEnd={zoom.dragEnd}
              />

              {/* By putting everything in the Group, axes will zoom/pan with the content.
                  This ensures synchronization, though labels will scale.
                  Given we cannot easily rescale mixed types, this is the robust solution for now. */}
              <Group transform={zoom.toString()}>
                {/* Grid */}
                <GridRows scale={yScale} width={innerWidth} left={margin.left} stroke="#333" />
                <GridColumns scale={xScale} height={innerHeight} top={margin.top} stroke="#333" />

                {/* Points */}
                {points.map((point, i) => (
                  <Point
                    key={`point-${i}`}
                    point={point}
                    xScale={xScale}
                    yScale={yScale}
                    xType={xType}
                    seriesKeys={seriesKeys}
                    neonColors={neonColors}
                  />
                ))}

                {/* Axes inside the group to ensure they move with the data */}
                <AxisLeft scale={yScale} left={margin.left} stroke="#fff" tickStroke="#fff" tickLabelProps={() => ({ fill: "#fff" })} />
                <AxisBottom scale={xScale} top={height - margin.bottom} stroke="#fff" tickStroke="#fff" tickLabelProps={() => ({ fill: "#fff" })} />
              </Group>

            </svg>

            {/* Controls */}
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 5 }}>
              <button type="button" style={{ color: "black" }} onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })}>
                +
              </button>
              <button type="button" style={{ color: "black" }} onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })}>
                -
              </button>
              <button type="button" style={{ color: "black" }} onClick={zoom.center}>
                Center
              </button>
              <button type="button" style={{ color: "black" }} onClick={zoom.reset}>
                Reset
              </button>
            </div>
          </div>
        )}
      </ZoomAny>
  );
};

const Point = ({ point, xScale, yScale, xType, seriesKeys, neonColors }: any) => {
  // Logic to determine cx based on scale type
  let cx;
  if (xType === 'numeric' || xType === 'time') {
      cx = xScale(point.x);
  } else {
      cx = xScale(point.x) + xScale.bandwidth() / 2;
  }

  const cy = yScale(point.y);
  const colorIndex = seriesKeys.indexOf(point.series) % neonColors.length;

  const { style, onClick } = useCrossFilter(point.row, point.pivot);

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={5}
      fill={neonColors[colorIndex]}
      fillOpacity={0.8}
      stroke="#fff"
      strokeWidth={1}
      style={{ ...style, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    />
  );
};

export { LookerCustomVizLayout };
