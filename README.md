# Heat Diffusion Lab

Interactive 2D heat-diffusion simulator with a native C++ engine, a thin Node.js WebSocket bridge, and a lightweight React frontend.

The C++ engine owns the numerical state. The backend only forwards commands and snapshots. The frontend focuses on controls and heatmap rendering.

![Heat Diffusion Lab demo](docs/media/demo.gif)

## Features

- 2D temperature grid simulation
- fixed and insulated boundary conditions
- configurable grid resolution
- adjustable thermal diffusivity and timestep
- multiple initial heat presets
- live C++ state streaming to the browser
- heatmap recording from the canvas

## Architecture

```text
frontend_web/  -> React + Vite UI and heatmap renderer
backend_node/  -> WebSocket bridge and process manager
engine_cpp/    -> native diffusion engine
docs/          -> MkDocs project documentation
```

Runtime flow:

```text
browser --WebSocket JSON--> Node backend --stdin/stdout--> C++ engine
browser <--WebSocket JSON-- Node backend <--stdout-------- C++ engine
```

## Simulation Model

The engine advances a 2D temperature field using a finite-difference discretization of the heat equation:

```math
\frac{\partial u}{\partial t} = \alpha \nabla^2 u
```

Current engine options:

- `boundaryMode`: `fixed` or `insulated`
- `initialPattern`: `center_hotspot`, `left_wall`, `checkerboard`, `ring`
- `diffusivity`
- `timeStep`
- `ambientTemperature`
- `hotspotTemperature`

## Folder Layout

```text
heat-diffusion-lab/
  backend_node/
  docs/
  engine_cpp/
  frontend_web/
  .gitignore
  mkdocs.yml
  README.md
  requirements-docs.txt
```

## Run Locally

### 1. Build the native engine

```powershell
cmake -S engine_cpp -B engine_cpp/build
cmake --build engine_cpp/build --config Release
```

This produces `engine_cpp/build/Release/heat_diffusion_cli.exe` on Windows.

### 2. Start the backend

```powershell
cd backend_node
pnpm install
pnpm start
```

The backend listens on port `3002` by default.

### 3. Start the frontend

```powershell
cd frontend_web
pnpm install
pnpm dev
```

By default, the frontend connects to `ws://localhost:3002`.

## Browser Message API

### Frontend to backend

```json
{
  "type": "configure",
  "data": {
    "gridWidth": 48,
    "gridHeight": 32,
    "diffusivity": 0.18,
    "timeStep": 0.12,
    "boundaryMode": "fixed",
    "initialPattern": "center_hotspot",
    "ambientTemperature": 18,
    "hotspotTemperature": 90,
    "playing": false
  }
}
```

Other message types:

- `set_playing`
- `reset`
- `request_state`

### Backend to frontend

The engine returns a `state` payload with:

- current simulation time
- current resolution and config
- min/avg/max temperature
- flattened temperature array

## Notes

- The frontend does not solve the PDE itself.
- The backend keeps the engine process alive and forwards snapshots.
- The engine also supports direct CLI output for one-shot inspection.
