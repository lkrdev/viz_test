import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { LookerCustomVizLayout } from './components/LookerCustomViz';
import { VizProvider } from "./components/VizContext";
import './index.css'
import { Looker, VisualizationDefinition, VisConfig, VisData, VisQueryResponse, VisUpdateDetails } from './types';
import { VIZ_ID, VIZ_LABEL, VIZ_OPTIONS } from "./viz-constants";

// Declare the global looker object
declare var looker: Looker;

// Extend the default interface to include our custom methods
interface CustomVisualizationDefinition extends VisualizationDefinition {
    addDynamicOptions: (newOptions: any, currentConfig: any) => void;
  // Helper to clear errors if available on the host
  clearErrors?: (selector?: string) => void;
}

// Simple debug logger
const debugLog = (msg: string, ...args: any[]) => {
  // Check for a debug flag in URL or similar if needed, currently just protecting console
  if (true) {
    console.log(`[${VIZ_ID}] ${msg}`, ...args);
  }
}

console.log('VIZ SCRIPT EXECUTING');

const vis: CustomVisualizationDefinition = {
  id: VIZ_ID,
  label: VIZ_LABEL,
  options: VIZ_OPTIONS,

  create(element: HTMLElement, config: VisConfig){
    debugLog('VIZ CREATE CALLED', element, config);
    this.addDynamicOptions = this.addDynamicOptions.bind(this);
    const root = ReactDOM.createRoot(element);
    
    // Store root on element or class instance if needed for destroy/cleanup, 
    // but strictly for this interface we just need to render.
    // Using 'any' cast here because 'this' context in Looker viz is dynamic/loose.
    (this as any).root = root;

    const updateConfig = (newConfig: any) => {
        const dynamicOptions = JSON.parse(config.dynamic_fields || '{}');
        let dynamicFieldsUpdated = false;
        const newDynamicOptions = { ...dynamicOptions };
  
        for (const key in newConfig) {
          if (newDynamicOptions.hasOwnProperty(key)) {
            newDynamicOptions[key].default = newConfig[key];
            dynamicFieldsUpdated = true;
          }
        }
  
        if (dynamicFieldsUpdated) {
          // @ts-ignore - trigger is optional in type but always present in Looker runtime
          this.trigger('updateConfig', [{ dynamic_fields: JSON.stringify(newDynamicOptions), ...newConfig }]);
        } else {
          // @ts-ignore
          this.trigger('updateConfig', [newConfig]);
        }
      };

    debugLog('VIZ CREATE RENDERING ROOT');
    root.render(
      <div>
        <h1>Custom Viz Container</h1>
      <VizProvider data={[]} config={config} queryResponse={{data: [], fields: {}, pivots: []}} details={undefined} addDynamicOptions={this.addDynamicOptions} updateConfig={updateConfig}>
        <LookerCustomVizLayout />
      </VizProvider>
      </div>
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
    debugLog('VIZ UPDATEASYNC CALLED', { data, config, queryResponse });
    this.clearErrors?.();

    try {
      const dynamicOptions = JSON.parse(config.dynamic_fields || '{}');
      // @ts-ignore
      this.trigger('registerOptions', { ...this.options, ...dynamicOptions });
    } catch (e) {
      console.error('Error parsing dynamic fields', e);
    }
    
    const updateConfig = (newConfig: any) => {
        const dynamicOptions = JSON.parse(config.dynamic_fields || '{}');
        let dynamicFieldsUpdated = false;
        const newDynamicOptions = { ...dynamicOptions };
  
        for (const key in newConfig) {
          if (newDynamicOptions.hasOwnProperty(key)) {
            newDynamicOptions[key].default = newConfig[key];
            dynamicFieldsUpdated = true;
          }
        }
  
        if (dynamicFieldsUpdated) {
          // @ts-ignore
          this.trigger('updateConfig', [{ dynamic_fields: JSON.stringify(newDynamicOptions), ...newConfig }]);
        } else {
          // @ts-ignore
          this.trigger('updateConfig', [newConfig]);
        }
      };
  
    // Recover root from create phase.
    const root = (this as any).root as ReactDOM.Root;

    if (root) {
      debugLog('VIZ UPDATEASYNC RENDERING ROOT');
        root.render(
          <div>
            <h1>Custom Viz Container</h1>
        <VizProvider data={data} config={config} queryResponse={queryResponse} details={details} addDynamicOptions={this.addDynamicOptions} updateConfig={updateConfig} onRenderComplete={done}>
            <LookerCustomVizLayout />
        </VizProvider>
          </div>
        )
    } else {
      console.error('VIZ ROOT NOT FOUND IN UPDATEASYNC');
    }
  }
}

looker.plugins.visualizations.add(vis)