import { useCallback } from 'react';
import { useViz } from '../components/VizContext';
import { LookerChartUtils } from '../types';

declare var LookerCharts: LookerChartUtils;

export const useCrossFilter = (row: any, pivot?: any) => {
  const { details } = useViz();
  const enabled = !!details?.crossfilterEnabled;

  const selection = enabled 
    ? LookerCharts.Utils.getCrossfilterSelection(row, pivot) 
    : 0; // 0 = NONE

  const onClick = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    if (enabled) {
      LookerCharts.Utils.toggleCrossfilter({
        row,
        pivot,
        event: event.nativeEvent,
      });
    }
  }, [enabled, row, pivot]);

  return {
    enabled,
    selection,
    style: { opacity: selection === 2 ? 0.25 : 1 },
    onClick: enabled ? onClick : undefined,
  };
};
