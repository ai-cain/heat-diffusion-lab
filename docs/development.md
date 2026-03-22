# Development Guide

This page describes the local workflow for `Heat Diffusion Lab`.

## Prerequisites

- Node.js
- pnpm
- CMake
- a C++17 compiler
- Python, only if you want to serve the docs site with MkDocs

## Local Workflow

### Build the native engine

From the repository root:

```powershell
cmake -S engine_cpp -B engine_cpp/build
cmake --build engine_cpp/build --config Release
```

### Start the backend

```powershell
cd backend_node
pnpm install
pnpm start
```

Default backend URL: `ws://localhost:3002`

### Start the frontend

```powershell
cd frontend_web
pnpm install
pnpm dev
```

Default frontend URL: `http://localhost:5173/`

## Typical Edit Paths

- frontend shell and rendering
  - [frontend_web/src/App.tsx](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/frontend_web/src/App.tsx)
- backend bridge behavior
  - [backend_node/server.js](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/backend_node/server.js)
- native engine logic
  - [engine_cpp/src/simulation_engine.cpp](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/engine_cpp/src/simulation_engine.cpp)
- documentation site
  - [mkdocs.yml](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/mkdocs.yml)

## Validation Commands

Frontend build:

```powershell
cd frontend_web
pnpm build
```

C++ build:

```powershell
cmake --build engine_cpp/build --config Release
```

Backend syntax check:

```powershell
cd backend_node
node --check server.js
```

Frontend production build:

```powershell
cd frontend_web
pnpm build
```
