export interface Query {
  query_id: string;
  height?: number | string;
  width?: number | string;
  [key: string]: any;
}

const queries: Query[] = [
  {
    query_id: "WI9e1KGncX4zhZ2Qy3o1B",
    height: 600,
    width: 800,
  },
];

export default queries;
