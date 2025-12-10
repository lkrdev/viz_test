# Animation & onRenderComplete Patterns

This document collects practical patterns for ensuring onRenderComplete (or done) is called only after a visualization is fully mounted and any animations or async rendering have completed. Copy the pattern that best fits your visualization or combine them.

All examples assume you obtain onRenderComplete from the Viz context (useViz) or receive done as an argument from the Looker runtime.

---

## 0) Minimal — no animations (call immediately)

Use this when rendering is synchronous and there are no animations or async post-render work.

```tsx
import React, { useEffect } from 'react';
import { useViz } from './VizContext';

const MySyncViz: React.FC = () => {
  const { data, onRenderComplete } = useViz();

  useEffect(() => {
    // Rendering is synchronous — signal completion immediately
    onRenderComplete?.();
  }, [data, onRenderComplete]);

  return <div>{/* render using DrillableCell for data cells */}</div>;
};
```

---

## 1) CSS-based animations — listen for animationend / transitionend

Use this when CSS animations or transitions are used. Attach listeners to the animated container to know when animations complete.

```tsx
import React, { useEffect, useRef } from 'react';
import { useViz } from './VizContext';

const CssAnimatedViz: React.FC = () => {
  const { data, onRenderComplete } = useViz();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      onRenderComplete?.();
      return;
    }

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      // small buffer to allow layout stabilization
      setTimeout(() => onRenderComplete?.(), 100);
    };

    el.addEventListener('animationend', finish);
    el.addEventListener('transitionend', finish);

    // Fallback: ensure we don't wait forever
    const fallback = setTimeout(() => {
      if (!finished) finish();
    }, 5000);

    return () => {
      el.removeEventListener('animationend', finish);
      el.removeEventListener('transitionend', finish);
      clearTimeout(fallback);
    };
  }, [data, onRenderComplete]);

  return <div ref={containerRef} className="my-animated-container">{/* animated markup */}</div>;
};
```

Notes:
- If multiple elements animate, ensure the container receives events or count events from children and call finish when all are done.
- Use a small buffer (50–300ms) after the last event to let the browser stabilize.

---

## 2) Promise-based / chart library callback

Many charting libraries provide a callback or Promise which resolves when animations finish. Prefer using the library-provided signal.

```tsx
import React, { useEffect } from 'react';
import { useViz } from './VizContext';
import { renderChart } from './chart-lib'; // hypothetical library that returns a Promise

const ChartPromiseViz: React.FC = () => {
  const { data, onRenderComplete } = useViz();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // renderChart resolves when its animation finishes
        await renderChart({ elementId: 'chart', data });
        if (!cancelled) {
          setTimeout(() => onRenderComplete?.(), 80); // buffer
        }
      } catch (e) {
        // Option: treat errors as failure or still signal completion to avoid hanging tests
        setTimeout(() => onRenderComplete?.(), 80);
      }
    };

    run();

    // Safety fallback
    const fallback = setTimeout(() => {
      if (!cancelled) onRenderComplete?.();
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [data, onRenderComplete]);

  return <div id="chart" />;
};
```

Tips:
- If the library exposes an "animationComplete" callback, register it and call onRenderComplete there.
- Prefer the library callback over timing heuristics.

---

## 3) requestAnimationFrame (DOM-driven animations) fallback

Use a couple of requestAnimationFrame ticks when you manipulate the DOM and need a quick, light-weight stabilization check.

```tsx
import React, { useEffect } from 'react';
import { useViz } from './VizContext';

const rafPromise = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve); // two frames for safety
    });
  });

const RafFallbackViz: React.FC = () => {
  const { data, onRenderComplete } = useViz();

  useEffect(() => {
    let mounted = true;

    const finalize = async () => {
      await rafPromise();
      if (mounted) {
        setTimeout(() => onRenderComplete?.(), 60); // small buffer
      }
    };

    finalize();

    const fallback = setTimeout(() => onRenderComplete?.(), 5000);
    return () => {
      mounted = false;
      clearTimeout(fallback);
    };
  }, [data, onRenderComplete]);

  return <div>{/* render DOM-driven components */}</div>;
};
```

When to use:
- Best for small DOM updates or micro-animations where no library callback exists.

---

## 4) Composite approach — combine library callbacks + DOM events + RAF

When using third-party charts plus additional DOM animations, combine signals to robustly know when everything finished.

```tsx
import React, { useEffect, useRef } from 'react';
import { useViz } from './VizContext';
import { renderChart } from './chart-lib'; // hypothetical render function that accepts callbacks

const CompositeViz: React.FC = () => {
  const { data, onRenderComplete } = useViz();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let done = false;
    const tryComplete = () => {
      if (done) return;
      done = true;
      setTimeout(() => onRenderComplete?.(), 80);
    };

    // 1) Start the chart and provide a completion callback if the lib supports it
    renderChart({
      element: containerRef.current,
      data,
      onAnimationEnd: tryComplete, // library callback
    });

    // 2) Listen for DOM-level CSS events as well
    const el = containerRef.current;
    if (el) {
      el.addEventListener('animationend', tryComplete);
      el.addEventListener('transitionend', tryComplete);
    }

    // 3) RFC fallback: two RAFs then buffer
    const rafId = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!done) {
          setTimeout(() => tryComplete(), 100);
        }
      })
    );

    // 4) Final safety fallback to avoid indefinite waiting
    const fallback = setTimeout(() => {
      if (!done) tryComplete();
    }, 5000);

    return () => {
      if (el) {
        el.removeEventListener('animationend', tryComplete);
        el.removeEventListener('transitionend', tryComplete);
      }
      cancelAnimationFrame(rafId);
      clearTimeout(fallback);
    };
  }, [data, onRenderComplete]);

  return <div ref={containerRef} />;
};
```

This approach:
- Waits for whichever signal occurs (chart lib callback, DOM animation events, or RAF completion).
- Uses a final fallback to ensure tests don't hang.

---

## 5) Patterns for robustness & test compatibility

- Always call onRenderComplete?.() only after visible UI is stable and interactive; tests and PDF exports depend on it.
- Use a small buffer (50–300ms) after the final signal to let fonts, images, and layout finish settling.
- Always include a reasonable timeout (2–5s) as a safety net so CI doesn't hang indefinitely.
- Prefer library-provided completion callbacks over timing-based heuristics.
- If multiple animated elements must finish, either count events or listen at a container that receives a final event.
- For unit/visual tests: ensure the test harness waits for the UI-complete marker (e.g., #query-done), but do not rely solely on static sleep — prefer explicit onRenderComplete calls from the viz.

---

## 6) Example: hooking Looker `done` from a non-React chart

If you are using the Looker plugin runtime and render a non-React chart inside custom_viz_container, call done when the chart signals completion:

```ts
// inside updateAsync(data, element, config, queryResponse, details, done) { ... }
renderThirdPartyChart(element, { data }).then(() => {
  // Chart animation completed
  done();
}).catch((err) => {
  // Optionally log and still call done to avoid test hangs
  console.error(err);
  done();
});
```

If the chart uses callbacks instead of Promises:

```ts
renderThirdPartyChart(element, {
  data,
  onAnimationComplete: () => {
    done();
  }
});
```

---

## Summary checklist for each viz
- Do not call onRenderComplete/done before the UI is stable.
- Prefer explicit completion callbacks (library or DOM events) over timeouts.
- Include a small buffer after completion for layout stabilization.
- Add a safety fallback timeout (2–5s).
- Ensure DrillableCell is used for displayed data values (separate static checks/tests enforce this).

Use these patterns as templates — adapt the event choice (animationend/transitionend/library callback/RAF) to the specifics of the visualization and animation mechanism in use.