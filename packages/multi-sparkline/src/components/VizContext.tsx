import * as React from 'react';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { VisConfig, VisData, VisQueryResponse } from '../types';

interface VizContextType {
  data: VisData;
  config: VisConfig;
  queryResponse: VisQueryResponse;
  addDynamicOptions: (newOptions: any, currentConfig: any) => void;
  updateConfig: (newConfig: any) => void;
  onRenderComplete?: () => void;
}

const VizContext = createContext<VizContextType | undefined>(undefined);

interface VizProviderProps {
  children: ReactNode;
  data: VisData;
  config: VisConfig;
  queryResponse: VisQueryResponse;
  addDynamicOptions: (newOptions: any, currentConfig: any) => void;
  updateConfig: (newConfig: any) => void;
  onRenderComplete?: () => void;
}

export const VizProvider: React.FC<VizProviderProps> = ({ children, data, config, queryResponse, addDynamicOptions, updateConfig, onRenderComplete }) => {
  const value = useMemo(() => ({
    data,
    config,
    queryResponse,
    addDynamicOptions,
    updateConfig,
    onRenderComplete
  }), [data, config, queryResponse, addDynamicOptions, updateConfig, onRenderComplete]);

  return (
    <VizContext.Provider value={value}>
      {children}
    </VizContext.Provider>
  );
};

export const useViz = (): VizContextType => {
  const context = useContext(VizContext);
  if (!context) {
    throw new Error('useViz must be used within a VizProvider');
  }
  return context;
};