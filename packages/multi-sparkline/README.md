# Looker Custom Visualization Template (React)

This is a comprehensive starter template for building Looker custom visualizations using React and TypeScript.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm start
    ```
    The server will run at `https://localhost:8080`.

3.  **Build for production:**
    ```bash
    npm run build
    ```
    The output bundle will be in the `dist/` directory.

## PDF Rendering Support

To ensure your custom visualization renders correctly in Looker downloads (PDFs, scheduled emails), you must signal to Looker when your visualization has finished rendering (including any animations).

This template provides an `onRenderComplete` callback via the `useViz` hook.

### Usage

In your main visualization component (e.g., `LookerCustomViz.tsx`), call `onRenderComplete` when your UI is stable.

**Example:**

```tsx
import React, { useEffect } from 'react';
import { useViz } from './VizContext';

const MyVizComponent = () => {
  const { data, onRenderComplete } = useViz();

  useEffect(() => {
    // If you have animations, wait for them to finish before calling done()
    // For example, if your chart animation takes 1000ms:
    const timer = setTimeout(() => {
        onRenderComplete?.();
    }, 1200); // 1000ms + buffer

    return () => clearTimeout(timer);
  }, [data, onRenderComplete]);

  return (
    <div>
      {/* Your viz code */}
    </div>
  );
};
```

If you do not have animations, you can call `onRenderComplete?.()` directly in a `useEffect` hook that runs after your data has been processed and rendered.
