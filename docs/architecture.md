# Architecture

`Heat Diffusion Lab` keeps the same high-level split as the original pendulum project:

1. The frontend gathers user parameters.
2. The backend forwards them to the native engine.
3. The C++ engine advances the simulation state.
4. The backend streams state snapshots back to the frontend.
5. The frontend renders the received data.

## Layer Responsibilities

### Frontend

- controls
- playback
- visualization
- heatmap rendering

### Backend

- WebSocket server
- message normalization
- native process bridge

### C++ Engine

- simulation state
- diffusion stepping
- snapshot generation

## Target Data Flow

```text
frontend -> backend -> C++ engine
frontend <- backend <- C++ engine
```

## Rewrite Direction

The copied scaffold currently uses pendulum-oriented source files.
The intended rewrite is to replace those with temperature-grid logic while keeping the same architecture.
