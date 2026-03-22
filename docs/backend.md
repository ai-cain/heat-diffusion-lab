# Backend

The backend is a thin bridge between the browser and the native engine.

## Responsibilities

- accept WebSocket messages from the frontend
- validate diffusion parameters
- keep the native engine alive
- forward snapshots back to the browser

## Browser API

Accepted message types:

- `configure`
- `set_playing`
- `reset`
- `request_state`

The `configure` payload is normalized in `backend_node/server.js` before it is turned into an engine command.

## Native Bridge

The backend starts `heat_diffusion_cli --stdio-server` and communicates with it over `stdin/stdout`.

Engine commands currently used:

- `CONFIG`
- `PLAY`
- `RESET`
- `REQUEST_STATE`

## Port

The backend listens on port `3002` by default.
Set `PORT` if you want to override it.
