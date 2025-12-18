export interface VisConfig {
  node_width?: number;
  node_padding?: number;
  color_range?: string[];
  label_type?: 'name' | 'name_value';
  show_null_points?: boolean;
  link_opacity?: number;
  node_border_width?: number;
  font_size?: number;
}

export interface Looker {
  plugins: {
    visualizations: {
      add: (vis: any) => void;
    };
  };
}

export interface LookerChartUtils {
  Utils: {
    openDrillMenu: (options: { links: any[]; event: any }) => void;
    htmlForCell: (cell: any) => string;
  };
}
