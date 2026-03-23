# Native Heat Diffusion

Interactive heat-diffusion simulator powered by a native C++ engine.

## Overview

The project is split into three clear layers:

- `engine_cpp/`: advances the temperature field and owns simulation state
- `backend_node/`: manages the native process and exposes a WebSocket API
- `frontend_web/`: renders the heatmap and exposes playback/configuration controls

## What You Can Control

- grid width and height
- thermal diffusivity
- numerical timestep
- boundary condition mode
- initial temperature preset
- ambient and hotspot temperatures

## What The UI Shows

- live temperature heatmap
- simulation time
- min, average, and max temperature
- engine connection state
- canvas recording support
