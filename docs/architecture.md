# Architecture

`Native Heat Diffusion` uses a simple three-layer architecture:

1. The frontend gathers simulation parameters and playback actions.
2. The backend normalizes those messages and forwards them to the engine.
3. The C++ engine advances the temperature field and emits snapshots.
4. The backend relays those snapshots back to every connected browser.
5. The frontend renders the latest state as a heatmap.

## Layer Responsibilities

### Frontend

- simulation controls
- playback state
- heatmap rendering
- recording the canvas stream

### Backend

- WebSocket server
- message normalization
- native process bridge
- engine lifecycle management

### C++ Engine

- authoritative simulation state
- finite-difference diffusion stepping
- boundary handling
- JSON snapshot generation

## Data Flow

```text
frontend --WebSocket JSON--> backend --stdin/stdout--> C++ engine
frontend <--WebSocket JSON-- backend <--stdout-------- C++ engine
```

## Command Protocol

Browser messages:

- `configure`
- `set_playing`
- `reset`
- `request_state`

Engine commands:

- `CONFIG`
- `PLAY`
- `RESET`
- `REQUEST_STATE`

The backend is intentionally thin: it should stay focused on transport, validation, and process management rather than numerical work.
