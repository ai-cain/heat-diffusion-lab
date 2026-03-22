# Heat Diffusion Lab

Interactive sandbox template for studying heat diffusion with the same architecture used in `normal-modes-of-coupled-pendulums`.

This folder is intended to become its own repository root later.

## What This Is

This project is a full structural copy of the pendulum lab, redirected toward a new theme:

- `frontend_web/` for controls and rendering
- `backend_node/` as the WebSocket bridge
- `engine_cpp/` as the native simulation engine
- `docs/` for documentation

The intended end state is a diffusion-focused app where the C++ engine owns the physical state and the frontend focuses on visualization.

## Current Status

This scaffold already includes:

- the same folder layout
- the same build setup
- the same frontend/backend/native split
- the same docs site structure

It still contains copied implementation details from the pendulum project in several source files.
That is intentional for now: this repo is a starting point so you can rewrite the domain logic yourself around heat diffusion.

## Target Idea

`Heat Diffusion Lab` can become an interactive environment for:

- 1D heat flow in a rod
- 2D heat diffusion on a plate
- fixed and insulated boundary conditions
- adjustable thermal diffusivity
- initial temperature profiles
- live heatmaps and time evolution

## Recommended Responsibilities

### Frontend

- sliders and controls
- playback
- canvas or grid rendering
- charts and overlays

### Backend

- WebSocket transport
- validation and normalization
- native process lifecycle

### C++ Engine

- authoritative simulation state
- numerical time stepping
- grid temperature updates
- snapshot emission back to the UI

## Suggested Rewrite Steps

1. Replace pendulum-specific math and state with a temperature field.
2. Redefine the engine protocol around diffusion parameters.
3. Change the frontend controls from masses/angles/lengths to grid size, diffusivity, timestep, and boundary conditions.
4. Replace the pendulum canvas renderer with a heatmap renderer.
5. Update the docs derivation to the heat equation and numerical scheme.

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

## Running The Copied Scaffold

If you want to verify the copied scaffold before rewriting it:

```powershell
cmake -S engine_cpp -B engine_cpp/build
cmake --build engine_cpp/build --config Release
```

```powershell
cd backend_node
pnpm install
pnpm start
```

```powershell
cd frontend_web
pnpm install
pnpm dev
```

## Notes

- This repo is intentionally a template clone, not a finished diffusion solver yet.
- You can move this folder into its own Git repository without carrying the original `.git` history.
