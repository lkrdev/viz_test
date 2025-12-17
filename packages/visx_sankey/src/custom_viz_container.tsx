import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { LookerCustomVizLayout } from './components/LookerCustomViz';
import { VizProvider } from "./components/VizContext";
import './index.css'
import { Looker, VisualizationDefinition, VisConfig, VisData, VisQueryResponse, VisUpdateDetails } from './types';

// Declare the global looker object
declare var looker: Looker;

// Extend the default interface to include our custom methods
interface CustomVisualizationDefinition extends VisualizationDefinition {
    addDynamicOptions: (newOptions: any, currentConfig: any) => void;
}

const vis: CustomVisualizationDefinition = {
  id: 'visx_sankey',
  label: 'Visx Sankey',
  options: {
    node_width: {
      type: 'number',
      label: 'Node Width',
      default: 20,
      display: 'range',
      min: 1,
      max: 100,
      section: 'Style',
      order: 1,
    },
    node_padding: {
      type: 'number',
      label: 'Node Padding',
      default: 20,
      display: 'range',
      min: 0,
      max: 100,
      section: 'Style',
      order: 2,
    },
    link_opacity: {
      type: 'number',
      label: 'Link Opacity',
      default: 0.5,
      display: 'range',
      min: 0,
      max: 1,
      step: 0.1,
      section: 'Style',
      order: 3,
    },
    show_labels: {
      type: 'boolean',
      label: 'Show Labels',
      default: true,
      display: 'radio',
      section: 'Style',
      order: 4,
    },
    background_color: {
        type: 'string',
        label: 'Background Color',
        default: 'transparent',
        display: 'color',
        section: 'Style',
        order: 5,
    }
  },

  create(element: HTMLElement, config: VisConfig){
    this.addDynamicOptions = this.addDynamicOptions.bind(this);
    const root = ReactDOM.createRoot(element);

    // Store root on element or class instance
    (this as any).root = root;

    const updateConfig = (newConfig: any) => {
        // Simple update trigger, logic for dynamic options removed for brevity as we are using static options mostly
        // @ts-ignore
        this.trigger('updateConfig', [newConfig]);
    };

    root.render(
      <VizProvider data={[]} config={config} queryResponse={{data: [], fields: {}, pivots: []}} details={undefined} addDynamicOptions={this.addDynamicOptions} updateConfig={updateConfig}>
        <LookerCustomVizLayout />
      </VizProvider>
    )
  },

  addDynamicOptions(newOptions: any, currentConfig: any) {
    const dynamicOptions = JSON.parse(currentConfig.dynamic_fields || '{}');
    const updatedDynamicOptions = { ...dynamicOptions, ...newOptions };

    // @ts-ignore
    this.trigger('registerOptions', { ...this.options, ...updatedDynamicOptions });
    // @ts-ignore
    this.trigger('updateConfig', [{ dynamic_fields: JSON.stringify(updatedDynamicOptions) }]);
  },


  updateAsync(data: VisData, element: HTMLElement, config: VisConfig, queryResponse: VisQueryResponse, details: VisUpdateDetails | undefined, done: () => void) {
    this.clearErrors?.();

    // Recover root from create phase.
    const root = (this as any).root as ReactDOM.Root;

    const updateConfig = (newConfig: any) => {
        // @ts-ignore
        this.trigger('updateConfig', [newConfig]);
    };

    if (root) {
        root.render(
        <VizProvider data={data} config={config} queryResponse={queryResponse} details={details} addDynamicOptions={this.addDynamicOptions} updateConfig={updateConfig} onRenderComplete={done}>
            <LookerCustomVizLayout />
        </VizProvider>
        )
    }
  }
}

looker.plugins.visualizations.add(vis)