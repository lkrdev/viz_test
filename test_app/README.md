# Looker Query Integration Test App

This application serves as a test harness for embedding and rendering Looker visualizations. It provides a Next.js environment to simulate the embedding context and verify the behavior of custom visualizations.

## Features
- **Looker Embedding**: Directly interacts with the Looker API to generate embed URLs.
- **Visualization Component**: Provides a `QueryVisualization` component to render specific Looker queries.
- **Dynamic Routing**: Supports testing any query ID via `/query/[query_id]`.

## Prerequisites

Ensure you have the following environment variables configured in `.env`:

```bash
NEXT_PUBLIC_LOOKER_HOST_URL=https://your-looker-instance.com
LOOKERSDK_CLIENT_ID=your_client_id
LOOKERSDK_CLIENT_SECRET=your_client_secret
LOOKERSDK_BASE_URL=https://your-looker-instance.com:19999
```

## Setup

1. **Install Dependencies**:
   ```bash
   yarn install
   ```

2. **Run Local Server**:
   ```bash
   yarn dev
   ```

## Usage

Navigate to the following route to test a specific query:
`http://localhost:3000/query/[query_id]`

For example:
`http://localhost:3000/query/500`

## Components

- **QueryVisualization**: Handles the embedding logic using `@looker/embed-sdk`.
- **API Route (`/api/embed`)**: Server-side proxy for signing and generating embed URLs.
- **Chatty Viz Harness (`/chatty/[query_id]`)**: A specialized test page for developing custom visualizations locally.
    - **How it Works**: It mocks the Looker host environment by injecting a "Ghost Iframe" (invisible) or standard iframe that loads the `sandy.js` and `vizsetup.js` scripts, establishing a handshake with your local visualization (served at `viz_url`).
    - **Usage**: params `viz_url` can be used to point to your local webpack dev server (e.g., `https://localhost:8080/main.js`).
