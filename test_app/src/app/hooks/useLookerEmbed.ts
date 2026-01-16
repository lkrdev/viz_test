import { getEmbedSDK, ILookerConnection } from "@looker/embed-sdk";
import { useCallback, useRef, useState } from "react";

interface UseLookerEmbedProps {
  model?: string;
  view?: string;
  query_id?: string;
}

export const useLookerEmbed = ({ model, view, query_id }: UseLookerEmbedProps) => {
  const [exploreRunComplete, setExploreRunComplete] = useState(false);
  const loadedRef = useRef(false);
  const embedConnectionRef = useRef<ILookerConnection | null>(null);

  // Basic validation to ensure we typically have strings
  const has_values = !!(model?.length && view?.length && query_id?.length);

  const embedContainerRef = useCallback(
    async (iframe: HTMLIFrameElement | null) => {
      const host = process.env.NEXT_PUBLIC_LOOKER_HOST_URL;
      if (!host) {
        console.error("NEXT_PUBLIC_LOOKER_HOST_URL is not defined");
        return;
      }

      // If we have an iframe and strictly have the necessary IDs
      if (iframe && has_values) {
        if (embedConnectionRef.current) {
          // If connection exists, reload with new params
          // Note: update logic based on SDK capabilities. 
          // Assuming loadQuery is valid on the connection object as per original code.
          // However, typings for ILookerConnection might vary. 
          // We will trust the original implementation's assumption.
          // Cast to any if strictly necessary, but let's try standard.
          // actually, common looker embed sdk connection doesn't always have loadQuery directly exposed 
          // on the interface unless it's a specific type (LookerEmbedExplore).
          // But let's copy the logic.
          // @ts-ignore
          if (typeof embedConnectionRef.current.loadQuery === 'function') {
            // @ts-ignore
            embedConnectionRef.current.loadQuery(model, view, query_id);
          }
        } else if (!loadedRef.current) {
          // Initialize and build
          loadedRef.current = true;
          getEmbedSDK().init(host, "/api/embed");

          try {
            const builder = getEmbedSDK().createQueryWithId(model!, view!, query_id!);

            builder.appendTo(iframe);
            builder.on("explore:run:complete", () => {
              setExploreRunComplete(true);
              if (!window.__LOOKER_EMBED_EVENTS__) window.__LOOKER_EMBED_EVENTS__ = [];
              window.__LOOKER_EMBED_EVENTS__.push({ type: "explore:run:complete" });
            });

            // Capture drill events
            builder.on("drillmenu:click", (event: any) => {
              if (!window.__LOOKER_EMBED_EVENTS__) window.__LOOKER_EMBED_EVENTS__ = [];
              window.__LOOKER_EMBED_EVENTS__.push({ type: "drillmenu:click", detail: event });
              return undefined;
            });

            const connection = await builder.build().connect();
            embedConnectionRef.current = connection;
          } catch (error) {
            console.error("Failed to build/connect embed", error);
            loadedRef.current = false;
          }
        }
      }
    },
    [query_id, model, view, has_values]
  );

  return { embedContainerRef, exploreRunComplete };
};

// Add to window for testing
declare global {
  interface Window {
    __LOOKER_EMBED_EVENTS__?: any[];
  }
}
