import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { LookerCustomVizLayout } from './components/LookerCustomViz';
import { VizProvider } from "./components/VizContext";
import './index.css';
import { Looker, VisConfig, VisData, VisQueryResponse, VisualizationDefinition, VisUpdateDetails } from './types';

// Declare the global looker object
declare var looker: Looker;

// Extend the default interface to include our custom methods
interface CustomVisualizationDefinition extends VisualizationDefinition {
    addDynamicOptions: (newOptions: any, currentConfig: any) => void;
}

const vis: CustomVisualizationDefinition = {
  id: 'hello_world_tsx',
  label: 'Hello World (TSX)',
  options: {
    title_text: {
      type: 'string',
      label: 'Title Text',
      default: 'Hello Looker!',
      display: 'text',
      section: 'Config',
      order: 1,
    }
  },

  create(element: HTMLElement, config: VisConfig){
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

    root.render(
      <VizProvider data={[]} config={config} queryResponse={{data: [], fields: {}, pivots: []}} addDynamicOptions={this.addDynamicOptions} updateConfig={updateConfig}>
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
        root.render(
        <VizProvider data={data} config={config} queryResponse={queryResponse} addDynamicOptions={this.addDynamicOptions} updateConfig={updateConfig} onRenderComplete={done}>
            <LookerCustomVizLayout />
        </VizProvider>
        )
    }
  }
}

looker.plugins.visualizations.add(vis)