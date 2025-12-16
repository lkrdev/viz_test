import "./utils";
import { Looker, VisualizationDefinition, LookerChartUtils } from "./types";
import { transformData } from "./utils";
import React from "react";
import ReactDOM from "react-dom";
import SankeyChart from "./SankeyChart";
import { ParentSize } from "@visx/responsive";

// Global values provided via the API
declare var looker: Looker;
declare var LookerCharts: LookerChartUtils;

const vis: VisualizationDefinition = {
  id: "sankey",
  label: "Sankey",
  options: {
    color_range: {
      type: "array",
      label: "Color Range",
      display: "colors",
      default: [
        "#dd3333",
        "#80ce5d",
        "#f78131",
        "#369dc1",
        "#c572d3",
        "#36c1b3",
        "#b57052",
        "#ed69af",
      ],
    },
    label_type: {
      default: "name",
      display: "select",
      label: "Label Type",
      type: "string",
      values: [{ Name: "name" }, { "Name (value)": "name_value" }],
    },
    show_null_points: {
      type: "boolean",
      label: "Plot Null Values",
      default: true,
    },
    node_width: {
      type: "number",
      label: "Node Width",
      default: 10,
    },
    node_padding: {
      type: "number",
      label: "Node Padding",
      default: 12,
    },
    link_opacity: {
      type: "number",
      label: "Link Opacity",
      default: 0.4,
      min: 0,
      max: 1,
      step: 0.05,
    },
    show_tooltip_values: {
      type: "boolean",
      label: "Show Tooltip Values",
      default: true,
    },
  },

  // Set up the initial state of the visualization
  create(element, config) {
    // No specific DOM setup needed for React render
  },

  // Render in response to the data or settings changing
  updateAsync(data, element, config, queryResponse, details, doneRendering) {
    // Basic validation
    const errors = [];
    if (queryResponse.fields.dimension_like.length < 2) {
      errors.push({
        title: "No Dimensions",
        message: "This visualization requires at least 2 dimensions.",
      });
    }
    if (queryResponse.fields.measure_like.length < 1) {
      errors.push({
        title: "No Measures",
        message: "This visualization requires at least 1 measure.",
      });
    }

    if (errors.length > 0) {
      this.addError?.(errors[0]);
      return;
    } else {
      this.clearErrors?.();
    }

    const dimensions = queryResponse.fields.dimension_like;
    const measure = queryResponse.fields.measure_like[0];

    // Transform data
    const sankeyData = transformData(data, dimensions, measure, config);

    // Render React Component
    ReactDOM.render(
      <ParentSize>
        {({ width, height }) => (
          <SankeyChart
            width={width}
            height={height}
            data={sankeyData}
            config={config}
            lookerCharts={LookerCharts}
          />
        )}
      </ParentSize>,
      element
    );

    doneRendering();
  },
};

looker.plugins.visualizations.add(vis);
