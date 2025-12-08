import React, { useEffect } from 'react'
import { useViz } from './VizContext';
import { MultiSparkline } from '../MultiSparkline';

const LookerCustomVizLayout: React.FC = () => {
  const { data, config, queryResponse, onRenderComplete } = useViz();

  useEffect(() => {
    // Signal to Looker that the visualization is rendered
    onRenderComplete?.();
  }, [data, config, onRenderComplete]);

  if(!config || !data || !queryResponse) {
    return <div>Loading...</div>
  }

  return (
    <div className="viz-container">
        <MultiSparkline data={data} queryResponse={queryResponse} />
    </div>
  );
};

export { LookerCustomVizLayout };
