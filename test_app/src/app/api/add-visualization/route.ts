import { LookerNodeSDK } from "@looker/sdk-node";
import { find } from "lodash";
import { LookmlVisualization } from "lookml-parser";
import { NextRequest, NextResponse } from "next/server";
import { DevVisualizationType, getManifest, getVizId, getVizUrl } from "../utils";
import { parsedManifestToLookML } from "../utils/parsedManifestToLookML";
import { update_project_file, withDevMode } from "../utils/sdk_project_methods";

const DEFAULT_TYPE: DevVisualizationType = "local"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const project_name = process.env.LOOKER_VIZ_PROJECT_NAME || searchParams.get("project_name");
  const package_name = searchParams.get("package_name");
  const type: DevVisualizationType = searchParams.get("type") as DevVisualizationType || DEFAULT_TYPE;
  const suffix = searchParams.get("suffix");
  const version = searchParams.get("version")

  if (type === "draft" && !suffix?.length) {
    return NextResponse.json(
      { error: "suffix param is required for draft type" },
      { status: 400 }
    );
  }

  if (type === "version" && !version?.length) {
    return NextResponse.json(
      { error: "version param is required for version type" },
      { status: 400 }
    );
  }

  if (!project_name) {
    return NextResponse.json(
      { error: "project_name param is required" },
      { status: 400 }
    );
  }

  if (!package_name) {
    return NextResponse.json(
      { error: "package_name param is required" },
      { status: 400 }
    );
  }
  const sdk = LookerNodeSDK.init40();
  return await withDevMode(sdk, async () => {
    try {
      let { parsed_manifest } = await getManifest(sdk, project_name) || {};
      const current_viz_id = getVizId(package_name, type, suffix)
      const current_vis_in_manifest = find(parsed_manifest?.visualization, { id: current_viz_id })
      if (current_vis_in_manifest) {
        return NextResponse.json(
          { message: "Visualization already exists" },
          { status: 200 }
        );
      } else {
        const new_viz: LookmlVisualization = {
          id: current_viz_id,
          $type: "visualization",
          url: getVizUrl(type, package_name, suffix, version ?? undefined)
        }
        if (!parsed_manifest) {
          parsed_manifest = {
            visualization: []
          }
        }
        if (Array.isArray(parsed_manifest?.visualization)) {
          parsed_manifest.visualization.push(new_viz)
        } else {
          parsed_manifest.visualization = [new_viz]
        }
        const new_manifest = parsedManifestToLookML(parsed_manifest)
        await update_project_file(sdk, project_name, {
          content: new_manifest,
          path: "manifest.lkml"
        })
        return NextResponse.json({ ok: true, manifest: new_manifest });
      }
    } catch (error) {
      console.error("Error updating manifest // adding visualization", error);
      return NextResponse.json(
        {
          error: "Failed to update manifest",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  })
}
