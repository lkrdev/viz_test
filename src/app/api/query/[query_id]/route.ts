import { LookerNodeSDK } from "@looker/sdk-node";
import { NextRequest, NextResponse } from "next/server";

const sdk = LookerNodeSDK.init40();

const getQueryForSlug = (slug: string) => {
  try {
    return sdk.ok(sdk.query_for_slug(slug));
  } catch (error) {
    return Promise.resolve(null);
  }
};

const getQuery = (query_id: string) => {
  try {
    return sdk.ok(sdk.query(query_id));
  } catch (error) {
    return getQueryForSlug(query_id);
  }
};

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ model: string; view: string; query_id: string }> }
) {
  let error: string | null = null;
  const { query_id } = await params;

  const query = await getQuery(query_id);

  if (!query) {
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
