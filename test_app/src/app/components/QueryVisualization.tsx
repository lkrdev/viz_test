"use client";
import { Box } from "@looker/components";
import { getEmbedSDK, ILookerConnection } from "@looker/embed-sdk";
import React, { useCallback } from "react";
import styled from "styled-components";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

import { useLookerEmbed } from "../hooks/useLookerEmbed";

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
  const { embedContainerRef, exploreRunComplete } = useLookerEmbed({
    model,
    view,
    query_id,
  });

  return (
    <StyledBox
      id="query-visualization"
      ref={embedContainerRef}
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      {exploreRunComplete && <Box display="none" id="query-done" />}
    </StyledBox>
  );
};

export default QueryVisualization;
