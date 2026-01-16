import { Looker40SDK } from "@looker/sdk";
import lookmlParser, { LookmlManifest } from 'lookml-parser';
import { get_project_manifest } from "./sdk_project_methods";

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

export * from "./viz_utils";
