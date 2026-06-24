# Tableau Shape Chart

## What is a Tableau Shape Chart?
In Tableau, a Shape Chart (or Shape Mark) is a type of chart that uses various distinct shapes to represent different categories of data. It is fundamentally a scatter plot or a categorical plot where the `Shape` property of the marks is mapped to a dimension. This is particularly useful for adding an extra layer of information without relying solely on color or size, making the visualization more accessible and easier to interpret at a glance.

Instead of standard dots, a shape chart might use triangles, circles, plus signs, stars, or even custom icons (like flags or logos) to distinguish between categories.

### Examples from Tableau
1. **Using Custom Shapes as Dashboard Filters:**
   Tableau allows users to import their own custom shapes (like country flags or company logos) and use them in dashboards, sometimes even acting as interactive filters.
   *(Image source from [Tableau Blog](https://www.tableau.com/nl-nl/blog/using-custom-shapes-dashboard-filters))*

2. **Standard Shape Palettes:**
   Tableau provides built-in shape palettes (e.g., filled shapes, hollow shapes, arrows, weather symbols) to quickly assign to dimension members.

## Implementation in Looker (via Custom Visualizations)
Looker does not have a native "Shape Chart" out of the box in its standard visualization library that behaves exactly like Tableau's (where you can dynamically map a dimension to a shape palette).

However, we can build a Custom Visualization in Looker using React and a charting library like **Recharts**.

### How we built it efficiently
1. **Charting Library Choice:** Instead of building a custom SVG scatter plot from scratch using D3, we opted for `recharts`. Recharts provides a `<ScatterChart>` component that natively supports different shapes via the `shape` prop on the `<Scatter>` component.
2. **Data Transformation:** Looker provides data in a row-based format (`[{ column1: value, column2: value }]`). To map this to Recharts where each shape needs its own `<Scatter>` series, we grouped the data by the "Shape Dimension" (e.g., the 3rd column in the query).
3. **Dynamic Configuration:** We built the component to dynamically read the available columns. It uses the first column for the X-axis, the second for the Y-axis, and the third column to determine the shape.
4. **Predefined Shapes:** Recharts supports several standard SVG symbols out of the box: `'circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'`. We created a palette array and cycled through it based on the index of the shape category.

### Reflection
The most efficient way to replicate Tableau-like functionality in Looker is not to reinvent the wheel but to leverage robust React charting libraries that already handle SVG rendering, axes, and tooltips. By structuring the Looker Custom Viz template to wrap a `<ResponsiveContainer>` from Recharts, we can achieve high-quality, responsive, and interactive charts with minimal custom drawing code. One area of improvement for next time would be to add a comprehensive settings panel in the Looker Viz configuration to let the user explicitly select which field maps to X, Y, and Shape, rather than relying strictly on column order.
