import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  dialColor: string;
  lineWidth: number;
  width: number;
  height: number;
  target?: number;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  label,
  dialColor,
  lineWidth,
  width,
  height,
  target
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Determine dimensions
    // We want a semi-circle.
    // The width of the drawing is 2*radius. The height is radius.
    // We have available width and height.
    // radius = min(width/2, height).
    // Let's add some margin.
    const margin = { top: 30, right: 30, bottom: 40, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const radius = Math.min(chartWidth / 2, chartHeight);

    // Position center.
    // If width is constrained, cx is width/2.
    // If height is constrained, cy is height - margin.bottom.
    const cx = margin.left + chartWidth / 2;
    const cy = margin.top + chartHeight; // Bottom of the semi-circle area

    // Adjust cy if we have a lot of vertical space?
    // Actually, usually we want to center it vertically as much as possible,
    // but for a semi-circle, it sits on the bottom.
    // Let's stick to placing the pivot at the bottom of the calculated radius area.
    // But we need to center that area in the svg.
    const drawingHeight = radius;
    const drawingWidth = radius * 2;

    const startY = (height - drawingHeight) / 2 + drawingHeight; // Vertical center?
    // No, let's just use the computed radius and center horizontally.
    // Vertically align to bottom of the visual area or center?
    // Let's align to bottom-ish to leave room for the needle pivot and label.

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height - margin.bottom - 20})`); // Lift up slightly for label

    const scale = d3.scaleLinear()
      .domain([min, max])
      .range([-Math.PI / 2, Math.PI / 2]);

    // Background Arc
    const bgArc = d3.arc()
      .innerRadius(radius - lineWidth)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append("path")
      .attr("d", bgArc as any)
      .attr("fill", "#e6e6e6");

    // Value Arc (Dial Color)
    // If value > max, cap it for the arc
    const clampedValue = Math.min(Math.max(value, min), max);

    const valueArc = d3.arc()
      .innerRadius(radius - lineWidth)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(clampedValue));

    g.append("path")
      .attr("d", valueArc as any)
      .attr("fill", dialColor);

    // Outer line (Target arc) - thin blue line in image
    const outerLineRadius = radius + 15;
    const outerArc = d3.arc()
        .innerRadius(outerLineRadius)
        .outerRadius(outerLineRadius + 1) // Thin line
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2);

    g.append("path")
        .attr("d", outerArc as any)
        .attr("fill", "#6688cc"); // Light blue-ish

    // Ticks / Labels
    const ticks = scale.ticks(5);
    ticks.forEach(tick => {
        const angle = scale(tick);
        // Place text outside the outer line
        const labelRadius = outerLineRadius - 25; // Inside? Image shows inside the arc but rotated?
        // Wait, image shows:
        // 50 is inside the colored band? No, "50" is near the boundary of the color change.
        // Let's put labels just inside the inner radius or just outside the outer radius.
        // To be safe and legible, let's put them just outside the outer line for now, or inside the empty space.

        // Let's put them slightly above the arc (inside).
        const textRadius = radius - lineWidth - 15;

        const tx = textRadius * Math.sin(angle);
        const ty = -textRadius * Math.cos(angle);

        // Rotate text to match angle? Or horizontal?
        // Image shows rotated numbers for 50 and 100.
        // 40.00 is horizontal.

        g.append("text")
            .attr("x", tx)
            .attr("y", ty)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .text(tick)
            .style("font-size", "10px")
            .style("fill", "#333");
            //.attr("transform", `rotate(${(angle * 180 / Math.PI)}, ${tx}, ${ty})`); // If we want rotation
    });

    // Needle
    const needleAngle = scale(clampedValue);
    const needleLen = radius - 5; // Touches the edge
    // Needle in image is a long thin triangle or line.
    // Let's draw a line.
    const nx = Math.sin(needleAngle) * needleLen;
    const ny = -Math.cos(needleAngle) * needleLen;

    g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", nx)
        .attr("y2", ny)
        .attr("stroke", "black")
        .attr("stroke-width", 3);

    // Pivot point
    g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 6)
        .attr("fill", "black");

    // Value Label (Large, centered above pivot)
    g.append("text")
        .attr("x", 0)
        .attr("y", -30) // Move up
        .attr("text-anchor", "middle")
        .text(value.toFixed(2))
        .style("font-size", "28px")
        .style("font-weight", "bold")
        .style("fill", "#333");

    // Field Label (Below pivot)
    g.append("text")
        .attr("x", 0)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .text(label)
        .style("font-size", "16px")
        .style("fill", "#666");

    // Target Marker
    if (target !== undefined) {
        const targetAngle = scale(target);
        const tx = outerLineRadius * Math.sin(targetAngle);
        const ty = -outerLineRadius * Math.cos(targetAngle);

        // Triangle marker
        // d3.symbolTriangle points up (0, -y).
        // We want it pointing IN (towards center).
        // At top (0 deg), it should point down.
        // So rotate 180.
        // At 90 deg (right), it should point left.
        // So rotation = angle + 180.

        // Wait, D3 symbols are centered at 0,0.
        const rotation = (targetAngle * 180 / Math.PI) + 180;

        g.append("path")
            .attr("d", d3.symbol().type(d3.symbolTriangle).size(60) as any)
            .attr("transform", `translate(${tx}, ${ty}) rotate(${rotation})`)
            .attr("fill", "#4466aa");

        // Target Text
        g.append("text")
             .attr("x", radius)
             .attr("y", -radius - 10)
             .text(`Target: ${target}`)
             .style("font-size", "12px")
             .style("fill", "#4466aa")
             .attr("text-anchor", "end");
    }

  }, [value, min, max, label, dialColor, lineWidth, width, height, target]);

  return <svg ref={svgRef} width={width} height={height} />;
};
