# Frontend

The frontend should become a visualization shell for the native heat-diffusion engine.

## Intended Responsibilities

- editing simulation parameters
- showing current status
- rendering a heatmap or scalar field
- controlling playback
- optionally plotting temperature slices over time

## Rewrite Direction

The copied frontend still reflects the pendulum project structure and UI logic.
That is expected for this scaffold.

The main rewrite path is:

1. Replace pendulum-oriented controls with diffusion controls.
2. Replace the pendulum canvas renderer with a heatmap renderer.
3. Keep the WebSocket pattern and overall application shell.
