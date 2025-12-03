"use client";
import { Box } from "@looker/components";
import { getEmbedSDK, ILookerConnection } from "@looker/embed-sdk";
import React, { useCallback } from "react";
import styled from "styled-components";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

const StyledBox = styled(Box)`
  & > iframe {
    width: 100%;
    height: 100%;
  }
`;

const QueryVisualization: React.FC<{
  query_id?: string;
  model?: string;
  view?: string;
  height?: number;
  width?: number;
}> = ({
  query_id,
  model,
  view,
  height = DEFAULT_HEIGHT,
  width = DEFAULT_WIDTH,
}) => {
  const [exploreRunComplete, setExploreRunComplete] = React.useState(false);
  const loadedRef = React.useRef(false);
  const embedConnectionRef = React.useRef<ILookerConnection | null>(null);
  const has_values = model?.length && view?.length && query_id?.length;

  const iframeRef = useCallback(
    async (iframe: HTMLIFrameElement) => {
      const host = process.env.NEXT_PUBLIC_LOOKER_HOST_URL;
      if (!host) {
        throw new Error("NEXT_PUBLIC_LOOKER_HOST_URL is not defined");
      }
      if (iframe && !loadedRef.current && has_values) {
        if (embedConnectionRef.current) {
          embedConnectionRef.current.loadQuery(model, view, query_id);
        } else if (loadedRef.current) {
          return;
        } else {
          loadedRef.current = true;
          getEmbedSDK().init(host, "/api/embed");
          await getEmbedSDK()
            .createQueryWithId(model, view, query_id)
            .appendTo(iframe)
            // .withParams({
            //   _theme: JSON.stringify({
            //     show_explore_header: false,
            //     show_explore_run_stop_button: false,
            //   }),
            // })
            .on("explore:run:complete", () => {
              setExploreRunComplete(true);
            })
            .build()
            .connect()
            .then((connection) => {
              embedConnectionRef.current = connection;
            });
        }
      }
    },
    [query_id, model, view]
  );

  return (
    <StyledBox
      id="query-visualization"
      ref={iframeRef}
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      {exploreRunComplete && <Box display="none" id="query-done" />}
    </StyledBox>
  );
};

export default QueryVisualization;
