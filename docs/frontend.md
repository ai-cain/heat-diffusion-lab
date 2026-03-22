# Frontend

The frontend is the visualization shell for the native heat-diffusion engine.

## Responsibilities

- editing simulation parameters
- showing current status
- rendering the temperature field as a heatmap
- controlling playback
- recording the canvas output

## Current Behavior

The main application lives in `frontend_web/src/App.tsx`.
It:

- opens a WebSocket connection to the backend
- sends normalized `configure` payloads
- sends play/pause and reset commands
- receives `state` snapshots from the engine
- draws the current grid on a `<canvas>`

## Main Files

- `src/App.tsx`: socket lifecycle, rendering, and page layout
- `src/components/ControlsPanel.tsx`: parameter controls
- `src/lib/heatLabMath.ts`: defaults, labels, and heatmap colors
- `src/types.ts`: shared frontend snapshot types
