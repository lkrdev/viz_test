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
  id: 'gauge2',
  label: 'Gauge 2',
  options: {
    dial_color: {
      type: 'string',
      label: 'Dial Color',
      default: '#3366cc',
      display: 'color',
      section: 'Config',
      order: 1
    },
    line_width: {
        type: 'number',
        label: 'Line Width',
        default: 30,
        display: 'text',
        section: 'Config',
        order: 2
    },
    gauge_label: {
        type: 'string',
        label: 'Label Override',
        default: '',
        display: 'text',
        section: 'Config',
        order: 3
    }
  },

  create(element: HTMLElement, config: VisConfig){
    this.addDynamicOptions = this.addDynamicOptions.bind(this);
    const root = ReactDOM.createRoot(element);

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
          // @ts-ignore
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

    // Dynamically register options
    try {
        const dynamicOptions = JSON.parse(config.dynamic_fields || '{}');

        // Build Field Picker Option
        const allFields = [
            ...(queryResponse.fields.measures || []),
            ...(queryResponse.fields.dimensions || []),
            ...(queryResponse.fields.table_calculations || [])
        ];

        // Format for Looker options: values: [{ "Label": "value" }, ...]
        const fieldOptions = allFields.map(f => ({ [f.label_short || f.label]: f.name }));

        // Default to last field
        const defaultField = allFields.length > 0 ? allFields[allFields.length - 1].name : '';

        const valueFieldOption = {
            value_field: {
                type: 'string',
                label: 'Value Field',
                display: 'select',
                values: fieldOptions,
                section: 'Config',
                default: defaultField,
                order: 0
            }
        };

        // Merge with existing options
        // @ts-ignore
        this.trigger('registerOptions', { ...this.options, ...dynamicOptions, ...valueFieldOption });

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
