import { useEffect, useRef, useState } from "react";
import { Chatty, ChattyHostConnection } from "@looker/chatty";
import { VIZ_SETUP_JS_URL, VIZ_SANDY_JS_URL } from "./constants";

export interface UseChattyHostResult {
  clientStatus: string;
  connection: ChattyHostConnection | null;
  error: string | null;
}

export const useChattyHost = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  vizUrl: string
): UseChattyHostResult => {
  const [clientStatus, setClientStatus] = useState<string>("waiting for client");
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<ChattyHostConnection | null>(null);
  const hostRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !vizUrl) return;

    const source = `
      <html>
      <head>
      <style type="text/css">
        html, body, #vis { height: calc(100% - 20px); margin: 0; padding: 0; border: none; }
        #vis { height: 100%; width: calc(100% - 20px); margin: 10px; border: none; }
      </style>
      <script type="text/javascript" src="${VIZ_SETUP_JS_URL}"></script>
      <script type="text/javascript" src="${VIZ_SANDY_JS_URL}"></script>
      </head>
        <body>
          <div id="vis"></div>
      <script src="${vizUrl}" onerror="console.error('Failed to load viz script from ${vizUrl}. Check if the URL is correct.')"></script>
          <script>
            setTimeout(() => {
              if (typeof looker !== 'undefined') {
                 // Debug: looker object exists
              } else {
                 console.error('DEBUG: looker object is undefined! Vizsetup.js might have failed or runs late.');
              }
            }, 2000);
          </script>
        </body>
      </html>
    `;

    try {
      const host = Chatty.createHostFromSource(source)
        .appendTo(containerRef.current)
        .on("page:properties:changed", (payload: any) => {
          console.log("Page properties changed", payload);
        })
        .on("page:config:changed", (payload: any) => {
          console.log("Page config changed", payload);
        })
        .on("SET_STATUS", (msg: any) => {
          setClientStatus(msg.status);
        })
        .build();

      hostRef.current = host;

      host
        .connect()
        .then((conn: ChattyHostConnection) => {
          connectionRef.current = conn;
          console.log("chatty host connected");
          setClientStatus("connected");
        })
        .catch((err: any) => {
          console.error("chatty connect failed", err);
          setClientStatus("connection failed");
          setError(err.message || "Connection failed");
        });
    } catch (e: any) {
       console.error("Error building Chatty host", e);
       setError(e.message);
    }

    return () => {
      try {
        if (hostRef.current && hostRef.current.iframe) {
          hostRef.current.iframe.remove();
        }
      } catch (e) {
        /* ignore cleanup errors */
      }
    };
  }, [vizUrl, containerRef]);

  return { clientStatus, connection: connectionRef.current, error };
};
