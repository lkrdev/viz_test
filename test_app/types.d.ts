interface Query {
  query_id: string;
  height?: number;
  width?: number;
}

type DevVisualizationType = "draft" | "prerelease" | "latest" | "version" | "local"