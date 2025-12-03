import { safeHWParse } from "@/app/utils";
import { LookerNodeSDK } from "@looker/sdk-node";
import { NextRequest, NextResponse } from "next/server";
const sdk = LookerNodeSDK.init40();

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ query_id: string; height: string; width: string }> }
) {
  const { query_id, height, width } = await params;

  try {
    const query = await sdk.ok(
      sdk.run_query({
        query_id,
        result_format: "png",
        image_height: safeHWParse(height, "height"),
        image_width: safeHWParse(width, "width"),
      })
    );
    const imageBuffer = Buffer.from(query, "binary");
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
