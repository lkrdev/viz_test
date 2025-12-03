import QueryVisualization from "@/app/components/QueryVisualization";
import { safeHWParse } from "@/app/utils";
import { Suspense } from "react";

export default async function QueryPage({
  params,
  searchParams,
}: {
  params: Promise<{ query_id: string }>;
  searchParams: Promise<{ height?: string; width?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const height = safeHWParse(sp?.height, "height");
  const width = safeHWParse(sp?.width, "width");

  const host = process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:4444";
  const response = await fetch(`${host}/api/query/${p?.query_id}`);

  const query = (await response.json()) as {
    query_id: string;
    model: string;
    view: string;
  } | null;

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
