import { Query } from "../../../types";

const queries: Query[] = [
  {
    name: "Sankey Flow Test",
    fields: {
      dimension_like: [
        { name: "users.gender", label: "Gender", value_format: null },
        { name: "users.state", label: "State", value_format: null },
        { name: "users.city", label: "City", value_format: null }
      ],
      measure_like: [
        { name: "users.count", label: "Count", value_format: null }
      ],
    },
    data: [
      {
        "users.gender": { value: "Male" },
        "users.state": { value: "California" },
        "users.city": { value: "San Francisco" },
        "users.count": { value: 50, links: [] },
      },
      {
        "users.gender": { value: "Male" },
        "users.state": { value: "California" },
        "users.city": { value: "Los Angeles" },
        "users.count": { value: 30, links: [] },
      },
       {
        "users.gender": { value: "Female" },
        "users.state": { value: "California" },
        "users.city": { value: "San Francisco" },
        "users.count": { value: 40, links: [] },
      },
      {
        "users.gender": { value: "Female" },
        "users.state": { value: "New York" },
        "users.city": { value: "NYC" },
        "users.count": { value: 60, links: [] },
      },
       {
        "users.gender": { value: "Male" },
        "users.state": { value: "New York" },
        "users.city": { value: "NYC" },
        "users.count": { value: 20, links: [] },
      }
    ],
  },
];

export default queries;
