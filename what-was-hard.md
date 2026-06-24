# What Was Hard

Implementing the "Shape Charts" custom Looker visualization using Recharts posed a few unexpected challenges related to dependency management and project build setup.

## 1. Recharts Version Compatibility & React Strictness
Initially, I installed the latest version of `recharts` (`v3.x`). However, Recharts v3 is highly strict about requiring React 18 or 19 and certain internal modules, which conflicted with the `marketplace-viz-tsx-skeleton` template's older React configurations or peer dependencies.
The build failed with multiple "Module not found: Error: Can't resolve 'react'" errors deep inside the `recharts` node module.
**Solution:** To fix this efficiently without restructuring the entire mono-repo's peer dependency tree, I downgraded to Recharts `v2.12.7`, which provides the exact same `<ScatterChart>` and shape APIs but is far more forgiving regarding the React peer-dependency environment.

## 2. Missing React and ReactDOM in the Sub-Package
Because I duplicated the `hello` package, I assumed the `package.json` had everything needed. But after adding `recharts`, Webpack failed to resolve `react` and `react-dom` modules internally.
**Solution:** I had to explicitly run `yarn add react react-dom` within the `packages/shape-charts` directory to ensure Webpack could bundle them properly.

## 3. Webpack `resolve.modules` Path Issue
In the `webpack.config.js` of the duplicated template, the resolve path for internal modules was set to `modules: [path.join(__dirname, '../src'), 'node_modules']`. Because the structure changed slightly, this broke some resolution.
**Solution:** Changing the config to `modules: [path.resolve(__dirname, 'src'), 'node_modules']` cleanly fixed the resolution issues.

## How to make it easier next time:
- **Up-to-date Template:** Update the base `packages/hello` template (and the root `package.json`) to have explicitly managed modern React versions that don't conflict with modern libraries like Recharts v3.
- **Yarn Workspaces:** If the monorepo used Yarn Workspaces properly (which memory indicates it currently does not), `react` and `react-dom` could be hoisted or centrally managed, preventing "Can't resolve React" errors in individual packages when installing charting plugins.