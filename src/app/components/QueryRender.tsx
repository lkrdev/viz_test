"use client";
import { Box } from "@looker/components";
import React from "react";

const QueryRender: React.FC<{
  api_url: string;
  height?: number;
  width?: number;
}> = ({ api_url, height = 500, width = 500 }) => {
  const [done, setDone] = React.useState(false);
  return (
    <Box>
      {done && <Box id="query-done" />}
      <img
        onLoad={() => setDone(true)}
        onError={(e) => console.log(e)}
        src={api_url}
        alt="query"
        height={height}
        width={width}
      />
    </Box>
  );
};

export default QueryRender;
