import QueryRender from "@/app/components/QueryRender";
import { DEFAULT_HOST_URL } from "@/app/constants";
import { safeHWParse } from "@/app/utils";
import { Suspense } from "react";

export default async function QueryPage({
  params,
  searchParams,
}: {
  params: Promise<{ query_id: string; model: string; view: string }>;
  searchParams: Promise<{ height?: string; width?: string, vis_type?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const height = safeHWParse(sp?.height, "height");
  const width = safeHWParse(sp?.width, "width");
  const vis_type = sp?.vis_type;

  const host = process.env.NEXT_PUBLIC_HOST_URL || DEFAULT_HOST_URL;
  const api_url = new URL(`${host}/api/query_render/${p?.query_id}`);
  api_url.searchParams.set("height", height?.toString() || "500");
  api_url.searchParams.set("width", width?.toString() || "500");
  if (vis_type?.length) {
    api_url.searchParams.set("vis_type", vis_type);
  }
  return (
    <main>
      <Suspense fallback={<div></div>}>
        <QueryRender api_url={api_url.toString()} height={height} width={width} />
      </Suspense>
    </main>
  );
}
