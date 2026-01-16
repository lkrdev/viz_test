"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { Box, Heading, Text, Spinner, Button } from "@looker/components";
import { useChattyHost } from "../use-chatty-host";
import { DEFAULT_VIZ_URL } from "../constants";

const VizContainer = styled.div`
  width: 100%;
  height: 80vh;
  border: 1px solid #ccc;
  /* The iframe will be created as a direct child of this div by Chatty */
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

export default function ChattyVizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryId = params?.query_id as string;
  const vizUrl = searchParams.get("viz_url") || DEFAULT_VIZ_URL;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [queryData, setQueryData] = useState<any>(null); // Recommend refactoring to explicit type later

  // Initialize Chatty Host via custom hook
  const { clientStatus, connection, error: hostError } = useChattyHost(containerRef, vizUrl);

  // 1. Fetch Query Data
  useEffect(() => {
    if (!queryId) return;

    const fetchData = async () => {
      try {
        setLoadingConfig(true);
        const response = await fetch(`/api/run_query/${queryId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch query data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Query data:", data);
        setQueryData(data);
        setLoadingConfig(false);
      } catch (err: any) {
        console.error("Error fetching query data:", err);
        setDataError(err.message);
        setLoadingConfig(false);
      }
    };

    fetchData();
  }, [queryId]);

  // 2. Send Data when both Connection and Data are ready
  useEffect(() => {
    if (connection && queryData) {
      console.log("Sending Create and UpdateAsync to viz...");
      // Send Create first
      connection.send("Create", { config: {} });

      // Then send UpdateAsync
      connection.send("UpdateAsync",
        queryData.data,
        null, // sandy.js ignores the 2nd argument
        {},   // config
        {     // queryResponse
          fields: queryData.fields,
          pivots: queryData.pivots
        },
        { changed: { config: true } } // details
      );
    }
  }, [connection, queryData]);

  // Manual resend for debugging
  const handleResend = () => {
    if (connection && queryData) {
      console.log("Resending Create/UpdateAsync...");
      connection.send("Create", { config: {} });
      connection.send("UpdateAsync",
        queryData.data,
        null,
        {},
        {
          fields: queryData.fields,
          pivots: queryData.pivots
        },
        { changed: { config: true } }
      );
    }
  };

  const displayError = dataError || hostError;

  return (
    <Box p="large">
      <Heading>Custom Viz Harness</Heading>
      <Text>Query ID: {queryId}</Text>
      <Text>Viz URL: {vizUrl}</Text>
      <Text>Status: {clientStatus}</Text>

      {displayError && <Text color="critical">{displayError}</Text>}
      {loadingConfig && <Spinner />}

      <Box mt="medium" mb="medium">
        <Button onClick={handleResend} disabled={!queryData || clientStatus !== 'connected'}>
          Resend Data
        </Button>
      </Box>

      {/* The iframe will be created as a direct child of this div */}
      <VizContainer ref={containerRef} />
    </Box>
  );
}
