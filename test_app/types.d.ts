interface Query {
  query_id: string;
  height?: number;
  width?: number;
  vis_config_override?: Record<string, any>;
}

type DevVisualizationType = "draft" | "prerelease" | "latest" | "version" | "local"