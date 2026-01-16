import { useCallback } from 'react';
import { useViz } from '../components/VizContext';
import { Link, LookerChartUtils } from '../types';

declare var LookerCharts: LookerChartUtils;

interface UseInteractionProps {
  row: any;
  pivot?: any;
  links?: Link[];
}

export const useInteraction = ({ row, pivot, links }: UseInteractionProps) => {
  const { details } = useViz();
  const crossfilterEnabled = !!details?.crossfilterEnabled;

  const selection = crossfilterEnabled
    ? LookerCharts.Utils.getCrossfilterSelection(row, pivot)
    : 0; // 0 = NONE

  const onClick = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    // Cross-filter takes precedence if enabled
    if (crossfilterEnabled) {
      LookerCharts.Utils.toggleCrossfilter({
        row,
        pivot,
        event: event.nativeEvent,
      });
    } else if (links && links.length > 0) {
      // Otherwise, open drill menu
      LookerCharts.Utils.openDrillMenu({
        links,
        event: event.nativeEvent,
      });
    }
  }, [crossfilterEnabled, row, pivot, links]);

  // Determine if interaction is possible
  const hasInteraction = crossfilterEnabled || (links && links.length > 0);

  return {
    style: {
        opacity: selection === 2 ? 0.25 : 1,
        cursor: hasInteraction ? 'pointer' : 'default'
    },
    onClick: hasInteraction ? onClick : undefined,
  };
};
