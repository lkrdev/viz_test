import QueryVisualization from "@/app/components/QueryVisualization";
import { safeHWParse } from "@/app/utils";
import { Suspense } from "react";

export default async function QueryPage({
  params,
  searchParams,
}: {
  params: Promise<{ query_id: string }>;
    searchParams: Promise<{ height?: string; width?: string; vis_type?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const height = safeHWParse(sp?.height, "height");
  const width = safeHWParse(sp?.width, "width");
  const vis_type = sp?.vis_type;

  const host = process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:4444";
  const url = new URL(`${host}/api/query/${p?.query_id}`);
  if (vis_type) {
    url.searchParams.set("vis_type", vis_type);
  }
  const response = await fetch(url.toString());

  const data = await response.json();
  if (!response.ok) {
    return <main>Error: {data.error || "Failed to fetch query"}</main>;
  }

  const query = data as {
    query_id: string;
    model: string;
    view: string;
  };

  return (
    <main>
      <Suspense fallback={<div></div>}>
        <QueryVisualization
          query_id={query?.query_id}
          model={query?.model}
          view={query?.view}
          height={height}
          width={width}
        />
      </Suspense>
    </main>
  );
}
