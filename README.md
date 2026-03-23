# Heat Diffusion Lab

High-performance interactive 2D heat diffusion simulator powered by a native C++ engine, a lightweight Node.js bridge, and a modern React frontend.

The system is designed with a clear separation of concerns:

- C++ handles numerical computation
- Node.js manages process orchestration and streaming
- React provides real-time visualization and control

![Heat Diffusion Lab demo](docs/media/demo.gif)

## Features

- Real-time 2D heat diffusion simulation
- Native C++ computation for high performance
- Live state streaming via WebSockets
- Interactive parameter tuning
- Multiple initial condition presets
- Support for different boundary conditions
- Heatmap rendering in the browser
- Canvas recording support

## Architecture

The project follows a modular, multi-layer architecture:

```text
frontend_web/   -> React + Vite UI (controls + visualization)
backend_node/   -> WebSocket bridge + engine process manager
engine_cpp/     -> Native simulation engine (finite difference solver)
docs/           -> MkDocs documentation
```

### Runtime Flow

```text
Browser --WebSocket(JSON)--> Node.js --stdin/stdout--> C++ Engine
Browser <--WebSocket(JSON)-- Node.js <--stdout-------- C++ Engine
```

- The engine owns the simulation state
- The backend keeps the native process alive and only forwards messages
- The frontend never computes physics, only renders

## Mathematical Model

The simulator solves the 2D heat equation:

```math
\frac{\partial u}{\partial t} = \alpha \left(
\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2}
\right)
```

Using:

- finite-difference discretization with a 5-point stencil
- explicit time integration with Forward Euler

### Discrete Update

```math
u_{i,j}^{n+1} = u_{i,j}^{n} + \alpha \Delta t \left(
u_{i-1,j}^{n} + u_{i+1,j}^{n} + u_{i,j-1}^{n} + u_{i,j+1}^{n} - 4u_{i,j}^{n}
\right)
```

### Boundary Conditions

- Fixed (Dirichlet): constant temperature at edges
- Insulated (Neumann): zero heat flux

### Initial Conditions

- Center hotspot
- Left wall
- Checkerboard
- Ring

## Configuration Parameters

The simulation can be configured in real time:

```json
{
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
```

## Getting Started

### 1. Build the C++ Engine

```bash
cmake -S engine_cpp -B engine_cpp/build
cmake --build engine_cpp/build --config Release
```

### 2. Start the Backend

```bash
cd backend_node
pnpm install
pnpm start
```

Default port: `3002`

### 3. Start the Frontend

```bash
cd frontend_web
pnpm install
pnpm dev
```

The frontend connects to:

```text
ws://localhost:3002
```

## WebSocket API

### Client -> Server

- `configure`: update simulation parameters
- `set_playing`: start or stop the simulation
- `reset`: reset the current state
- `request_state`: fetch a snapshot

### Server -> Client

State payload includes:

- simulation time
- grid resolution
- temperature statistics (`min`, `avg`, `max`)
- flattened temperature array

## Design Principles

- Separation of concerns: physics, transport, and UI are independent
- Streaming-first architecture: real-time updates over WebSockets
- Native performance: compute-intensive logic runs in C++
- Extensibility: easy to add new patterns, solvers, or boundary modes

## Future Improvements

- GPU acceleration with WebGPU or CUDA
- Implicit solvers for larger timesteps
- Adaptive grid resolution
- Export to video or datasets
- 3D heat diffusion support

## License

MIT

## Author

**ai-cain**

## Tagline

> Real-time physics simulation powered by native performance and modern web technologies.
