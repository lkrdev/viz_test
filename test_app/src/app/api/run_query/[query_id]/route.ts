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
  }: { params: Promise<{ query_id: string }> }
) {
  const { query_id } = await params;

  // First verify the query exists and resolve ID from slug if needed
  const query = await getQuery(query_id);

  if (!query || !query.id) {
    return NextResponse.json(
      { error: `query ${query_id} not found` },
      { status: 404 }
    );
  }

  try {
    // Run the query using the resolved ID
    const result = await sdk.ok(
      sdk.run_query({
        query_id: query.id,
        result_format: "json_detail",
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running query:", error);
    return NextResponse.json(
      { error: "Failed to run query" },
      { status: 500 }
    );
  }
}
