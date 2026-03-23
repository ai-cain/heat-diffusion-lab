# C++ Engine

The native engine owns the real numerical state of `Native Heat Diffusion`.

## Responsibilities

- store the temperature field
- apply the diffusion update rule
- handle boundary conditions
- emit snapshots for the frontend

## Main Components

- `diffusion_system.hpp/.cpp`
  Stores the grid, resets the initial pattern, advances the finite-difference update, and serializes state as JSON.
- `simulation_engine.hpp/.cpp`
  Maintains play/pause state, current simulation time, revision number, and the stdio command loop.
- `main.cpp`
  Runs either a one-shot CLI mode or the persistent `--stdio-server` mode.

## Numerical Scheme

The current implementation uses a 2D explicit finite-difference update with configurable substeps to keep the timestep stable relative to the chosen diffusivity.

Supported boundary modes:

- `fixed`
- `insulated`

Supported initial patterns:

- `center_hotspot`
- `left_wall`
- `checkerboard`
- `ring`
