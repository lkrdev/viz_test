import { safeHWParse } from "@/app/utils";
import { LookerNodeSDK } from "@looker/sdk-node";
import { NextRequest, NextResponse } from "next/server";
import { getQuery, getSlugWithVisOverrides } from "../../utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ query_id: string }> }
) {
  const { query_id } = await params;
  const { searchParams } = request.nextUrl;
  const height = searchParams.get("height");
  const width = searchParams.get("width");
  let vis_type = searchParams.get("vis_type");
  let vis_config_str = searchParams.get("vis_config");
  let vis_config = null;
  if (vis_config_str) {
    try {
      const parsed = JSON.parse(vis_config_str);
      if (typeof parsed === "object" && parsed !== null) {
        vis_config = parsed;
      }
    } catch (e) {
      console.error("Failed to parse vis_config", e);
    }
  }

  let local = [
    process.env.LOOKER_VIZ_PROJECT_NAME,
    process.env.LOOKER_VIZ_LOCAL_ID,
  ].filter(Boolean);
  if (local.length === 2) {
    vis_type = local.join("::");
  }

  try {
    const sdk = LookerNodeSDK.init40();
    const query =
      vis_type?.length || vis_config
        ? await getSlugWithVisOverrides(sdk, query_id, vis_type, vis_config)
        : await getQuery(sdk, query_id);
    if (!query?.id) {
      return NextResponse.json(
        { error: `query ${query_id} not found` },
        { status: 404 }
      );
    }
    const result = await sdk.ok(
      sdk.run_query({
        query_id: query.id,
        result_format: "png",
        image_height: safeHWParse(height, "height"),
        image_width: safeHWParse(width, "width"),
      })
    );
    const imageBuffer = Buffer.from(result, "binary");
    const response = new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to run query" }, { status: 500 });
  }
}
