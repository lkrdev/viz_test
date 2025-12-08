import React from 'react';
import { Cell, Link, LookerChartUtils } from '../types';

// Declare global LookerCharts for use within this component to avoid passing it down
declare var LookerCharts: LookerChartUtils;

interface DrillableCellProps {
  /**
   * The cell object from Looker's data response containing value, rendered text, and links.
   */
  cell: Cell;
  /**
   * Optional class name for styling the container or link.
   */
  className?: string;
  /**
   * Optional inline styles.
   */
  style?: React.CSSProperties;
  /**
   * Determines how the cell's value is displayed and if drill links are enabled.
   * - 'rendered': (Default) Displays the 'rendered' value (if available), otherwise 'value'. Drill links are enabled if present.
   * - 'raw': Displays only the 'value' property. Drill links are disabled.
   */
  displayMode?: 'rendered' | 'raw';
}

export const DrillableCell: React.FC<DrillableCellProps> = ({ cell, className, style, displayMode = 'rendered' }) => {
  // Safety check: ensure cell exists
  if (!cell) return null;

  const links = cell.links;
  const rawValue = cell.value !== undefined ? cell.value : '';

  let displayValue: string | number | boolean = '';
  let shouldRenderAsLink = false;

  if (displayMode === 'raw') {
    displayValue = rawValue;
    shouldRenderAsLink = false; // Explicitly disable links in raw mode
  } else { // displayMode === 'rendered' (default behavior)
    displayValue = cell.rendered !== undefined ? cell.rendered : rawValue;
    const hasLinks = Array.isArray(links) && links.length > 0;
    shouldRenderAsLink = hasLinks; // Enable links only if present in rendered mode
  }

  const handleDrill = (event: React.MouseEvent | React.KeyboardEvent) => {
    // This function should only be called if shouldRenderAsLink is true
    if (!shouldRenderAsLink || !links) return;
    
    // Stop propagation to prevent parent handlers from firing
    event.stopPropagation();
    event.preventDefault();

    LookerCharts.Utils.openDrillMenu({
      links: links,
      event: event.nativeEvent,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleDrill(event);
    }
  };

  if (shouldRenderAsLink) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={handleDrill}
        onKeyDown={handleKeyDown}
        className={className}
        title="Click to drill down"
        style={{
            cursor: 'pointer',
            textDecoration: 'underline',
            color: '#0059b3', // Standard Looker link color
            ...style
        }}
      >
        {String(displayValue)}
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {String(displayValue)}
    </span>
  );
};
