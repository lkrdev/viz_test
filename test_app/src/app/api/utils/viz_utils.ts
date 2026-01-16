export type DevVisualizationType = "draft" | "prerelease" | "latest" | "version" | "local"

export const PATH_MAP: { [key in DevVisualizationType]: string } = {
  draft: "draft",
  prerelease: "prerelease",
  latest: "latest",
  version: "v",
  local: "local"
}

const DEFAULT_CDN_PATH = "https://cdn.lkr.dev/viz"
const DEFAULT_LOCAL_URL = "https://localhost:8080/bundle.js"

export const getVizId = (
  package_name: string,
  type: DevVisualizationType,
  suffix?: string | null
) => {
  if (process.env.LOOKER_VIZ_PROJECT_NAME?.length && process.env.LOOKER_VIZ_LOCAL_ID?.length && type === "local") {
    return `${process.env.LOOKER_VIZ_PROJECT_NAME}::${process.env.LOOKER_VIZ_LOCAL_ID}`;
  }
  if (type === "draft") {
    return [package_name, type, suffix].filter(Boolean).join("_");
  } else {
    return [package_name, type].filter(Boolean).join("_");
  }
}

export const getVizUrl = (
  type: DevVisualizationType,
  package_name: string,
  suffix?: string | null,
  version?: string
) => {
  if (process.env.LOOKER_VIZ_PROJECT_NAME?.length && process.env.LOOKER_VIZ_LOCAL_ID?.length && type === "local") {
    return process.env.LOOKER_VIZ_LOCAL_URL || DEFAULT_LOCAL_URL
  }
  const path = process.env.DEFAULT_CDN_PATH || DEFAULT_CDN_PATH;
  const baseUrl = `${path}/${PATH_MAP[type]}`;

  if (type === "version") {
    if (!version?.length) {
      throw new Error("Version is required for version type");
    }
    return `${baseUrl}/${version}/${package_name}/bundle.js`;
  }

  if (type === "draft" && suffix?.length) {
    return `${baseUrl}/${suffix}/${package_name}/bundle.js`;
  }

  return `${baseUrl}/latest/${package_name}/bundle.js`;
}
