# Heat Diffusion Lab

Documentation scaffold for a heat-diffusion project built from the same architecture as the pendulum lab.

## Vision

The long-term goal is an interactive environment where:

- the native C++ engine advances a temperature field
- the backend streams state snapshots
- the frontend renders heatmaps and controls

## Structure

- `frontend_web/`: UI and rendering
- `backend_node/`: WebSocket bridge
- `engine_cpp/`: native solver
- `docs/`: project docs

## Important Note

This folder is a project template cloned from the pendulum codebase.
Some current implementation details still refer to the original project and are expected to be rewritten.
