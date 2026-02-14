import React from 'react';
import VisxSankey from '../VisxSankey'; // Check this path again. From src/components/LookerCustomViz.tsx to src/VisxSankey.tsx is ../VisxSankey.tsx
import { useViz } from './VizContext';
import { ParentSize } from '@visx/responsive';

export const LookerCustomVizLayout = () => {
  const { config } = useViz();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: config.background_color || 'transparent',
      }}
    >
      <ParentSize>
        {({ width, height }) => (
          <VisxSankey width={width} height={height} />
        )}
      </ParentSize>
    </div>
  );
};
