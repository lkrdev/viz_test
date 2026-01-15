import { LookerNodeSDK } from "@looker/sdk-node";
import { NextRequest, NextResponse } from "next/server";
import { getQuery, getSlugWithVisType } from "../../utils";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      query_id: string;
    }>
  }
) {
  const sdk = LookerNodeSDK.init40();
  const { query_id } = await params;

  let vis_type = request.nextUrl.searchParams.get("vis_type");
  let local = [process.env.LOOKER_VIZ_PROJECT_NAME, process.env.LOOKER_VIZ_LOCAL_ID].filter(Boolean)
  if (local.length === 2) {
    vis_type = local.join("::")
  }

  const query = vis_type?.length ? await getSlugWithVisType(sdk, query_id, vis_type) : await getQuery(sdk, query_id);
  if (!query?.id) {
    return NextResponse.json(
      { error: `query ${query_id} not found` },
      { status: 404 }
    );
  } else {
    return NextResponse.json({
      model: query.model,
      view: query.view,
      query_id: query.client_id,
    });
  }
}
