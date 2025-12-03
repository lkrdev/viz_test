import { LookerNodeSDK } from "@looker/sdk-node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const src = searchParams.get("src");
  if (!src) {
    return NextResponse.json(
      { error: "url in src param is required" },
      { status: 400 }
    );
  }
  try {
    const sdk = LookerNodeSDK.init40();

    const embed_url = await sdk.ok(
      sdk.create_embed_url_as_me({
        target_url: `${process.env.NEXT_PUBLIC_LOOKER_HOST_URL}${src}`,
      })
    );

    const response = NextResponse.json(embed_url);

    return response;
  } catch (error) {
    console.error("Looker embed error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate embed URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
