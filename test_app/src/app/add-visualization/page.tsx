import { DEFAULT_HOST_URL } from "@/app/constants";
import { Suspense } from "react";

export default async function AddVisualizationPage({
  searchParams,
}: {
  searchParams: Promise<{
    project_name?: string,
    package_name?: string,
    type?: string,
    suffix?: string,
    version?: string
  }>;
}) {
  const sp = await searchParams;

  const host = process.env.NEXT_PUBLIC_HOST_URL || DEFAULT_HOST_URL;
  const api_url = new URL(`${host}/api/add-visualization`);
  for (const [key, value] of Object.entries(sp)) {
    if (value) {
      api_url.searchParams.set(key, value);
    }
  }
  const response = await fetch(api_url.toString());
  const data = await response.json();
  if (!response.ok) {
    return <main style={{
      whiteSpace: "pre-wrap",
      color: "black",
      backgroundColor: "white"
    }}>Error: {data.error || "Failed to fetch query"}</main>;
  }
  return (
    <main>
      <Suspense fallback={<div></div>}>
        <code style={{
          whiteSpace: "pre-wrap",
          color: "black",
          backgroundColor: "white"
        }}>{JSON.stringify(data, null, 2)}</code>
      </Suspense>
    </main>
  );
}
