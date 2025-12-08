import React, { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { VisData, VisQueryResponse } from "./types";

interface MultiSparklineProps {
  data: VisData;
  queryResponse: VisQueryResponse;
}

export const MultiSparkline: React.FC<MultiSparklineProps> = ({
  data,
  queryResponse,
}) => {
  const processedData = useMemo(() => {
    const dimensions = queryResponse.fields.dimensions || [];
    const measures = queryResponse.fields.measures || [];

    if (dimensions.length < 3 || measures.length < 1) {
      return [];
    }

    // Identify Date Dimension
    const dateDim = dimensions.find(
      (d: any) =>
        d.type?.startsWith("date") ||
        d.is_timeframe ||
        d.name.toLowerCase().includes("date")
    ) || dimensions[0];

    // Identify Grouping Dimensions
    const otherDims = dimensions.filter((d: any) => d.name !== dateDim.name);
    const titleDim = otherDims[0];
    const subtitleDim = otherDims[1] || titleDim;

    const measure = measures[0];

    const groups: Record<
      string,
      { title: string; subtitle: string; series: any[] }
    > = {};

    data.forEach((row) => {
      const title = row[titleDim.name].value;
      const subtitle = row[subtitleDim.name].value;
      const dateVal = row[dateDim.name].value;
      const measureVal = row[measure.name].value;

      const key = `${title}-${subtitle}`;

      if (!groups[key]) {
        groups[key] = {
          title: String(title),
          subtitle: String(subtitle),
          series: [],
        };
      }

      groups[key].series.push({
        date: new Date(dateVal),
        value: Number(measureVal),
      });
    });

    return Object.values(groups).map((group) => {
      // Sort by date
      group.series.sort((a, b) => a.date.getTime() - b.date.getTime());

      const len = group.series.length;
      const current = len > 0 ? group.series[len - 1].value : 0;
      const prev = len > 1 ? group.series[len - 2].value : current;
      const absChange = current - prev;
      const pctChange = prev !== 0 ? absChange / prev : 0;

      return {
        ...group,
        current,
        absChange,
        pctChange,
      };
    });
  }, [data, queryResponse]);

  if (processedData.length === 0) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        Please provide 3 dimensions (Date, Group, Subgroup) and 1 measure.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
      {processedData.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px solid #eee",
            height: "80px",
          }}
        >
          {/* Logo Placeholder */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#333",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "15px",
              fontSize: "18px",
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            {item.title.charAt(0)}
          </div>

          {/* Title & Subtitle */}
          <div style={{ width: "200px", flexShrink: 0 }}>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>
              {item.title}
            </div>
            <div style={{ color: "#888", fontSize: "14px" }}>
              {item.subtitle}
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ flex: 1, height: "100%", padding: "0 20px" }}>
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={item.series}>
                <defs>
                  <linearGradient id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9900" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff9900" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ff9900"
                  fill={`url(#gradient-${idx})`}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Value & Change */}
          <div style={{ textAlign: "right", width: "150px", flexShrink: 0 }}>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>
              ${item.current.toFixed(2)}
            </div>
            <div
              style={{
                color: item.absChange >= 0 ? "#00aa00" : "#d32f2f",
                fontSize: "14px",
              }}
            >
              {item.absChange >= 0 ? "+" : ""}
              {item.absChange.toFixed(2)} ({(item.pctChange * 100).toFixed(2)}%)
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
