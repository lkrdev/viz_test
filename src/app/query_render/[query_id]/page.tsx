import QueryRender from "@/app/components/QueryRender";
import { DEFAULT_HOST_URL } from "@/app/constants";
import { safeHWParse } from "@/app/utils";
import { Suspense } from "react";

export default async function QueryPage({
  params,
  searchParams,
}: {
  params: Promise<{ query_id: string; model: string; view: string }>;
  searchParams: Promise<{ height?: string; width?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const height = safeHWParse(sp?.height, "height");
  const width = safeHWParse(sp?.width, "width");

  const host = process.env.NEXT_PUBLIC_HOST_URL || DEFAULT_HOST_URL;
  const api_url = `${host}/api/query_render/${p?.query_id}?height=${height}&width=${width}`;
  return (
    <main>
      <Suspense fallback={<div></div>}>
        <QueryRender api_url={api_url} height={height} width={width} />
      </Suspense>
    </main>
  );
}
