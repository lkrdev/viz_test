import React, { useEffect, useMemo } from 'react'
import { useViz } from './VizContext';
import { processData } from '../utils';
import { SparklineRow } from './SparklineRow';

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, onRenderComplete, queryResponse } = useViz();

  const sparklineGroups = useMemo(() => {
    if (!data || !queryResponse) return [];
    return processData(data, queryResponse);
  }, [data, queryResponse]);

  useEffect(() => {
    // Call onRenderComplete after a short delay to ensure rendering is done.
    // AGENTS.md recommends a buffer.
    const timer = setTimeout(() => {
      onRenderComplete?.();
    }, 200);
    return () => clearTimeout(timer);
  }, [sparklineGroups, onRenderComplete]);

  if(!config || !data) {
    return <div>Loading...</div>
  }

  return (
    <div className="viz-container" style={{ padding: '20px', fontFamily: 'Open Sans, sans-serif' }}>
        {sparklineGroups.length > 0 ? (
            <div>
                {sparklineGroups.map(group => (
                    <SparklineRow key={group.id} group={group} />
                ))}
            </div>
        ) : (
            <div className="data-preview">
                No data available or insufficient dimensions. Please ensure you have at least 1 Date dimension, 1 Grouping dimension, and 1 Measure.
            </div>
        )}
    </div>
  );
};

export { LookerCustomVizLayout };
