import { safeHWParse } from "@/app/utils";
import { LookerNodeSDK } from "@looker/sdk-node";
import { NextRequest, NextResponse } from "next/server";
import { getQuery, getSlugWithVisType } from "../../utils";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ query_id: string }> }
) {
  const { query_id } = await params;
  const { searchParams } = request.nextUrl;
  const height = searchParams.get("height");
  const width = searchParams.get("width");
  const vis_type = searchParams.get("vis_type");

  try {
    const sdk = LookerNodeSDK.init40();
    const query = vis_type?.length ? await getSlugWithVisType(sdk, query_id, vis_type) : await getQuery(sdk, query_id);
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
