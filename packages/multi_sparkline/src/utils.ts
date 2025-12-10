import { VisQueryResponse, VisData, Cell, Row } from './types';
import { group } from 'd3-array';

export interface SparklineDataPoint {
  date: Date;
  value: number;
}

export interface SparklineGroup {
  id: string;
  labelCell1: Cell;
  labelCell2?: Cell;
  valueCell: Cell;
  data: SparklineDataPoint[];
  currentValue: number;
  previousValue: number;
  change: number;
  percentChange: number;
}

export const processData = (data: VisData, queryResponse: VisQueryResponse): SparklineGroup[] => {
  const dimensions = queryResponse.fields.dimensions;
  const measures = queryResponse.fields.measures;

  if (!dimensions || dimensions.length < 2) return [];

  const dateDim = dimensions[0];
  const groupDim1 = dimensions[1];
  const groupDim2 = dimensions.length > 2 ? dimensions[2] : undefined;
  const measure = measures[0];

  // Group by the 2nd (and 3rd) dimension
  const grouped = group(data, (d: Row) => {
    const val1 = (d[groupDim1.name] as Cell).value;
    const val2 = groupDim2 ? (d[groupDim2.name] as Cell).value : '';
    return `${val1}|${val2}`;
  });

  const result: SparklineGroup[] = [];

  grouped.forEach((rows, key) => {
    if (!rows || rows.length === 0) return;

    // Map to points
    const points: SparklineDataPoint[] = rows.map(r => {
      const cell = r[measure.name] as Cell;
      const val = cell ? cell.value : undefined;
      const dateVal = (r[dateDim.name] as Cell).value;
      return {
        date: new Date(dateVal),
        value: Number(val),
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Find the row corresponding to the last point to get the correct drillable cell
    const lastPoint = points[points.length - 1];
    // We need to find which row produced this last point.
    // Since we sort by date, and rows might not be sorted, we find it.
    // Optimization: if we assume unique dates per group, we can match by date.
    const lastRow = rows.find(r => {
        const d = new Date((r[dateDim.name] as Cell).value);
        return d.getTime() === lastPoint.date.getTime();
    }) || rows[rows.length - 1];

    const prev = points.length > 1 ? points[points.length - 2] : null;

    const currentValue = lastPoint.value;
    const previousValue = prev ? prev.value : 0;
    const change = prev ? currentValue - previousValue : 0;
    const percentChange = prev && previousValue !== 0 ? (change / previousValue) : 0;

    const firstRow = rows[0];

    result.push({
      id: key,
      labelCell1: firstRow[groupDim1.name] as Cell,
      labelCell2: groupDim2 ? (firstRow[groupDim2.name] as Cell) : undefined,
      valueCell: lastRow[measure.name] as Cell,
      data: points,
      currentValue,
      previousValue,
      change,
      percentChange,
    });
  });

  return result;
};
