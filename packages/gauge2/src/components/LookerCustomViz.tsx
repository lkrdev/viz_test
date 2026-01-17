import React, { useEffect, useState, useRef } from 'react'
import { useViz } from './VizContext';
import { Gauge } from './Gauge';
import { VisQueryResponse } from '../types';

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, queryResponse, onRenderComplete } = useViz();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onRenderComplete?.();
  }, [data, config, onRenderComplete, dimensions]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setDimensions({ width: clientWidth, height: clientHeight });
        }
    };

    // Initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if(!config || !data || data.length === 0) {
    return <div ref={containerRef} style={{ width: '100%', height: '100%' }}>Loading... or No Data</div>
  }

  // Determine Field
  const getField = () => {
    const allFields = [
        ...(queryResponse.fields.measures || []),
        ...(queryResponse.fields.dimensions || []),
        ...(queryResponse.fields.table_calculations || [])
    ];

    // Default to last field
    let selectedField = allFields.length > 0 ? allFields[allFields.length - 1] : null;

    if (config.value_field) {
        const found = allFields.find(f => f.name === config.value_field);
        if (found) selectedField = found;
    }

    return selectedField;
  };

  const field = getField();

  if (!field) {
      return <div ref={containerRef} style={{ width: '100%', height: '100%' }}>No numeric fields found.</div>
  }

  const rowsToRender = data.slice(0, 10); // min(10, N)
  const isSingle = rowsToRender.length === 1;

  // Calculate Max Value
  // We want a unified scale for all gauges in the grid usually, or per gauge?
  // Usually unified to make them comparable.
  const allValues = rowsToRender.map(r => {
      const val = r[field.name]?.value;
      return typeof val === 'number' ? val : Number(val);
  }).filter(n => !isNaN(n));

  const dataMax = Math.max(...allValues, 0);
  // Add some buffer, or use 100 if it looks like percentage?
  // If dataMax <= 1, maybe it is percentage 0-1? No, usually looker handles that in formatting.
  // If dataMax <= 100, use 100?
  // Let's just use dataMax * 1.2 or 100 if dataMax is small?
  // Safest is to use dataMax.
  const maxValue = dataMax > 0 ? dataMax : 100;
  // If we want nice ticks, we might want to round up to nearest 10/100.
  // But strictly `dataMax` ensures the needle is within range.

  // Grid Layout
  // If single, take full space.
  // If multiple, use flex grid.

  let itemWidth = dimensions.width;
  let itemHeight = dimensions.height;

  if (!isSingle) {
      // Simple grid logic
      // e.g. 2 columns for < 4, 3 columns for < 9?
      // Or just responsive flex.
      // Let's force a grid depending on count to make them nice.
      const cols = rowsToRender.length > 4 ? 3 : (rowsToRender.length > 1 ? 2 : 1);
      const rows = Math.ceil(rowsToRender.length / cols);
      itemWidth = dimensions.width / cols;
      itemHeight = dimensions.height / rows;
  }

  // Cap height to keep aspect ratio if needed, but Gauge handles it.

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }}>
        {rowsToRender.map((row, i) => {
            const value = row[field.name]?.value;
            const numValue = Number(value);

            // Label override or default to field label
            // "The label should be the measure" (i.e. field label)
            // "I should have an option to change the label" -> config.gauge_label
            // If grid, we usually want to identify the row.
            // The prompt says: "If there is one row returned, then it should be a single guage. The label should be the measure".
            // If N rows, it doesn't specify what the label should be. Usually it's the Dimension value that splits the rows.
            // But if we just output 10 gauges, what distinguishes them?
            // "default to the last field returned".
            // If I have "Brand" and "Count", and pick "Count".
            // I get 10 rows of brands. The gauge shows count.
            // The label under the gauge should probably be "Nike", "Adidas" (the dimension value).
            // But the requirements say "The label should be the measure".
            // "option to change the label".

            // Let's implement:
            // If 1 row: Label = config.gauge_label || field.label.
            // If N rows: Label = config.gauge_label || (Dimension Value if available) || field.label.

            let labelText = config.gauge_label || field.label_short || field.label;

            if (!isSingle) {
                // Try to find a dimension to use as label?
                // Or just stick to the measure label?
                // Usually in a grid of gauges (trellis), the title of each gauge is the dimension value.
                // Let's check if there are dimensions.
                if (queryResponse.fields.dimensions && queryResponse.fields.dimensions.length > 0) {
                    // Use the first dimension's value for this row.
                    const dim = queryResponse.fields.dimensions[0];
                    if (row[dim.name]) {
                        labelText = row[dim.name].rendered || row[dim.name].value;
                    }
                }
            }

            // Dial Color
            const dialColor = config.dial_color || '#3366cc';
            const lineWidth = Number(config.line_width) || 30;

            // Target? The image has a target.
            // Is there a target field? Or option?
            // Prompt doesn't specify target config.
            // I'll ignore target for now or add it if found in data (e.g. table calc 'target').

            return (
                <div key={i} style={{ width: itemWidth, height: itemHeight, padding: '10px', boxSizing: 'border-box' }}>
                   {!isNaN(numValue) ? (
                       <Gauge
                         value={numValue}
                         min={0}
                         max={maxValue}
                         label={String(labelText)}
                         dialColor={dialColor}
                         lineWidth={lineWidth}
                         width={itemWidth - 20}
                         height={itemHeight - 20}
                       />
                   ) : (
                       <div>Invalid Data</div>
                   )}
                </div>
            )
        })}
    </div>
  );
};

export { LookerCustomVizLayout };
