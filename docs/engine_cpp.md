# C++ Engine

The native engine is the place where `Heat Diffusion Lab` should own the real numerical state.

## Intended Responsibilities

- store the temperature field
- apply the diffusion update rule
- handle boundary conditions
- emit snapshots for the frontend

## Suggested Numerical Core

Possible first implementation:

- 1D or 2D finite-difference heat equation
- explicit Euler or a stable scheme of your choice
- configurable timestep and diffusivity

## Current Status

The engine directory was copied from the pendulum project as a structural starting point.
Its files should be rewritten around diffusion data structures and update loops.
