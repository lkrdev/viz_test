import * as React from 'react';
import { ModernSankey } from './components/ModernSankey';
import { VisConfig } from './types';
import { Looker, LookerChartUtils } from './types'; // Assuming types.ts has these or I need to add them.

// Global values provided via the API
declare var looker: Looker;
declare var LookerCharts: LookerChartUtils;

export const vis = {
  id: 'modern_sankey',
  label: 'Modern Sankey',
  options: {
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: [
        '#dd3333',
        '#80ce5d',
        '#f78131',
        '#369dc1',
        '#c572d3',
        '#36c1b3',
        '#b57052',
        '#ed69af',
      ],
    },
    label_type: {
      type: 'string',
      label: 'Label Type',
      display: 'select',
      values: [
        { 'Name': 'name' },
        { 'Name (Value)': 'name_value' }
      ],
      default: 'name',
    },
    show_null_points: {
      type: 'boolean',
      label: 'Plot Null Values',
      default: true,
    },
    node_width: {
      type: 'number',
      label: 'Node Width',
      default: 15,
    },
    node_padding: {
      type: 'number',
      label: 'Node Padding',
      default: 10,
    },
    link_opacity: {
      type: 'number',
      label: 'Link Opacity',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.1
    },
    node_border_width: {
      type: 'number',
      label: 'Node Border Width',
      default: 0,
    },
    font_size: {
      type: 'number',
      label: 'Font Size',
      default: 12,
    }
  },

  create(element: HTMLElement, config: VisConfig) {
      element.style.fontFamily = '"Open Sans", "Helvetica", sans-serif';
  },

  updateAsync(data: any, element: HTMLElement, config: VisConfig, queryResponse: any, details: any, done: () => void) {
    let root = (element as any)._reactRoot;
    if (!root) {
        const importReactDOM = require('react-dom/client');
        root = importReactDOM.createRoot(element);
        (element as any)._reactRoot = root;
    }

    root.render(
      <ModernSankey
        data={data}
        config={config}
        queryResponse={queryResponse}
        width={element.clientWidth}
        height={element.clientHeight}
        lookerCharts={LookerCharts}
      />
    );

    done();
  }
};

looker.plugins.visualizations.add(vis);
