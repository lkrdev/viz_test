import { Looker40SDK } from "@looker/sdk";
import lookmlParser, { LookmlManifest } from 'lookml-parser';
import { get_project_manifest } from "./sdk_project_methods";

const DEFAULT_LOCAL_URL = "https://localhost:8080/bundle.js"

export const getQueryForSlug = async (sdk: Looker40SDK, slug: string) => {
  try {
    return await sdk.ok(sdk.query_for_slug(slug));
  } catch (error) {
    console.error(`Error fetching query for slug ${slug}:`, error);
    return null;
  }
};

export const getQuery = async (sdk: Looker40SDK, query_id: string) => {
  try {
    return await sdk.ok(sdk.query(query_id));
  } catch (error) {
    return await getQueryForSlug(sdk, query_id);
  }
};

export const getSlugWithVisOverrides = async (
  sdk: Looker40SDK,
  slug: string,
  vis_type?: string | null,
  vis_config?: any
) => {
  try {
    const query = await getQuery(sdk, slug);
    if (!query) {
      console.error(`Query not found for slug/id: ${slug}`);
      return null;
    } else {
      const new_vis_config = { ...query.vis_config, ...(vis_config || {}) };
      if (vis_type?.length) {
        new_vis_config.type = vis_type;
      }
      const newQuery = {
        model: query.model,
        view: query.view,
        fields: query.fields,
        pivots: query.pivots,
        fill_fields: query.fill_fields,
        filters: query.filters,
        filter_expression: query.filter_expression,
        sorts: query.sorts,
        limit: query.limit,
        column_limit: query.column_limit,
        total: query.total,
        row_total: query.row_total,
        subtotals: query.subtotals,
        vis_config: new_vis_config,
        filter_config: query.filter_config,
        visible_ui_sections: query.visible_ui_sections,
        dynamic_fields: query.dynamic_fields,
        query_timezone: query.query_timezone,
      };
      return sdk.ok(sdk.create_query(newQuery));
    }
  } catch (error) {
    console.error("Error in getSlugWithVisOverrides:", error);
    return null;
  }
};

export const getManifest = async (sdk: Looker40SDK, project_name: string) => {
  try {
    const manifest = await get_project_manifest(sdk, project_name);
    const parsed_manifest = lookmlParser.parse(manifest) as LookmlManifest;


    return { parsed_manifest, manifest };
  } catch (error) {
    console.error("Error in getManifest:", error);
    return null;
  }
}

export const getVizId = (
  package_name: string,
  type: DevVisualizationType,
  suffix?: string | null
) => {
  if (process.env.LOOKER_VIZ_PROJECT_NAME?.length && process.env.LOOKER_VIZ_LOCAL_ID?.length && type === "local") {
    return `${process.env.LOOKER_VIZ_PROJECT_NAME}::${process.env.LOOKER_VIZ_LOCAL_ID}`;
  }
  return [package_name, type, suffix].filter(Boolean).join("_");
}

const PATH_MAP: { [key in DevVisualizationType]: string } = {
  draft: "draft",
  prerelease: "prerelease",
  latest: "latest",
  version: "v",
  local: "local"
}

const DEFAULT_CDN_PATH = "https://cdn.lkr.dev/viz"

export const getVizUrl = (
  type: DevVisualizationType,
  id: string,
  version?: string
) => {
  if (process.env.LOOKER_VIZ_PROJECT_NAME?.length && process.env.LOOKER_VIZ_LOCAL_ID?.length && type === "local") {
    return process.env.LOOKER_VIZ_LOCAL_URL || DEFAULT_LOCAL_URL
  }
  const path = process.env.DEFAULT_CDN_PATH || DEFAULT_CDN_PATH;
  if (type === "version") {
    if (!version?.length) {
      throw new Error("Version is required for version type");
    }
    return `${path}/${PATH_MAP[type]}/${version}/${id}`;
  }
  return `${path}/${PATH_MAP[type]}/${id}`;
}