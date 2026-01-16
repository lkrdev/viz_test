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
import { useInteraction } from "../hooks/useInteraction";
import { rescale } from "../utils/zoom-utils";

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
        fontFamily: "sans-serif",
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
          const cell = valObj && valObj[pivot.key] ? valObj[pivot.key] : null;
          const val = cell ? cell.value : null;

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
              links: cell?.links,
            });
          }
        });
      } else {
        let xVal = d[firstDim.name].value;
        if (xType === "time") {
            xVal = new Date(xVal);
        }
        const cell = d[firstMeas.name];
        points.push({
          x: xVal,
          y: cell.value,
          series: "default",
          row: d,
          pivot: null,
          links: cell.links,
        });
      }
    });

    return { points, xKey, yKey, seriesKeys, xType };
  }, [data, dimensions, measures, pivots]);

  // Initial Scales
  const { initialXScale, initialYScale } = useMemo(() => {
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

      const yValues = points.map((p) => p.y);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);

      const yScale = scaleLinear({
        domain: [minY, maxY],
        range: [height - margin.bottom, margin.top],
        nice: true,
      });

      return { initialXScale: xScale, initialYScale: yScale };
  }, [points, xType, width, height]);


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
        {(zoom: any) => {
            // Recalculate scales based on zoom transform
            // X Scale
            let currentXScale = initialXScale;
            if (xType !== 'category') {
                const newDomain = [
                    initialXScale.invert((initialXScale.range()[0] - zoom.transformMatrix.translateX) / zoom.transformMatrix.scaleX),
                    initialXScale.invert((initialXScale.range()[1] - zoom.transformMatrix.translateX) / zoom.transformMatrix.scaleX)
                ];
                currentXScale = initialXScale.copy();
                currentXScale.domain(newDomain);
            }

            // Y Scale
            const newYDomain = [
                initialYScale.invert((initialYScale.range()[1] - zoom.transformMatrix.translateY) / zoom.transformMatrix.scaleY),
                initialYScale.invert((initialYScale.range()[0] - zoom.transformMatrix.translateY) / zoom.transformMatrix.scaleY)
            ];
            // Note: scaleLinear range is [bottom, top], so range[0] is bottom (larger pixel), range[1] is top (smaller pixel)
            // But invert logic: y' = t.y + k * y_px. Wait.
            // standard zoom logic for Y:
            // The zoom transform applies to the coordinate system.
            // We want to find the domain value that maps to the current viewport range.

            // Let's rely on the range mapping.
            // The viewport top is margin.top. Viewport bottom is height - margin.bottom.
            // We want to know which data values map to these pixels under the transform.

            const renderXScale = rescale(initialXScale, 'x', zoom.transformMatrix);
            const renderYScale = rescale(initialYScale, 'y', zoom.transformMatrix);

            return (
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

                    <Group>
                        {/* Grid */}
                        <GridRows scale={renderYScale} width={innerWidth} left={margin.left} stroke="#444" strokeOpacity={0.6} />
                        <GridColumns scale={renderXScale} height={innerHeight} top={margin.top} stroke="#444" strokeOpacity={0.6} />

                        {/* Points - clipped */}
                        <Group clipPath="url(#zoom-clip)">
                            {points.map((point, i) => (
                            <Point
                                key={`point-${i}`}
                                point={point}
                                xScale={renderXScale}
                                yScale={renderYScale}
                                xType={xType}
                                seriesKeys={seriesKeys}
                                neonColors={neonColors}
                            />
                            ))}
                        </Group>

                        {/* Axes - on top of grid/points usually, or below? Usually axes on top to be legible */}
                        <AxisLeft
                            scale={renderYScale}
                            left={margin.left}
                            stroke="#888"
                            tickStroke="#888"
                            tickLabelProps={() => ({ fill: "#ccc", fontSize: 11, fontFamily: 'sans-serif' })}
                        />
                        <AxisBottom
                            scale={renderXScale}
                            top={height - margin.bottom}
                            stroke="#888"
                            tickStroke="#888"
                            tickLabelProps={() => ({ fill: "#ccc", fontSize: 11, fontFamily: 'sans-serif' })}
                        />
                    </Group>

                    </svg>

                    <ZoomControls zoom={zoom} />
                </div>
            );
        }}
      </ZoomAny>
  );
};

const Point = ({ point, xScale, yScale, xType, seriesKeys, neonColors }: any) => {
  let cx;
  if (xType === 'numeric' || xType === 'time') {
      cx = xScale(point.x);
  } else {
      cx = xScale(point.x) + xScale.bandwidth() / 2;
  }

  const cy = yScale(point.y);

  // Optimization: Don't render if off-screen (though clip-path handles visibility, DOM nodes still exist)
  // But clipPath is safer for partial circles.

  const colorIndex = seriesKeys.indexOf(point.series) % neonColors.length;
  const { style, onClick } = useInteraction({ row: point.row, pivot: point.pivot, links: point.links });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={5} // Fixed radius for semantic zoom
      fill={neonColors[colorIndex]}
      fillOpacity={0.8}
      stroke="#fff"
      strokeOpacity={0.2} // Subtle stroke
      strokeWidth={1}
      style={{ ...style }}
      onClick={onClick}
    />
  );
};

const ZoomControls = ({ zoom }: { zoom: any }) => {
    return (
        <div style={{
            position: "absolute",
            top: 20,
            right: 20,
            display: "flex",
            gap: "8px",
            backgroundColor: "rgba(30, 30, 30, 0.9)",
            padding: "8px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            border: "1px solid #444"
        }}>
            <ZoomBtn onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })} label="+" />
            <ZoomBtn onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })} label="-" />
            <ZoomBtn onClick={zoom.center} label="Center" />
            <ZoomBtn onClick={zoom.reset} label="Reset" />
        </div>
    );
};

const ZoomBtn = ({ onClick, label }: { onClick: () => void, label: string }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            background: "#333",
            border: "1px solid #555",
            color: "#eee",
            padding: "4px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#555"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#333"}
    >
        {label}
    </button>
);

export { LookerCustomVizLayout };
