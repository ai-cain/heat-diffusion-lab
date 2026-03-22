# Backend

The backend should remain a thin bridge between the browser and the native engine.

## Intended Role

- accept WebSocket messages from the frontend
- validate diffusion parameters
- keep the native engine alive
- forward snapshots back to the browser

## Typical Inputs

- grid width and height
- thermal diffusivity
- boundary conditions
- initial temperature field
- play/pause/reset commands

## Typical Outputs

- current simulation time
- temperature grid
- metadata for rendering

## Current Status

The backend folder was copied from the pendulum project and is ready to be rewritten around diffusion-specific commands.
