import express from 'express';
import { spawn } from 'child_process';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const port = Number(process.env.PORT) || 3002;
const clients = new Set();

const DEFAULT_GRID_WIDTH = 48;
const DEFAULT_GRID_HEIGHT = 32;
const DEFAULT_DIFFUSIVITY = 0.18;
const DEFAULT_TIME_STEP = 0.12;
const DEFAULT_AMBIENT_TEMPERATURE = 18;
const DEFAULT_HOTSPOT_TEMPERATURE = 90;

const allowedBoundaryModes = new Set(['fixed', 'insulated']);
const allowedInitialPatterns = new Set([
  'center_hotspot',
  'left_wall',
  'checkerboard',
  'ring',
]);

const resolveEnginePath = () => {
  const extension = process.platform === 'win32' ? '.exe' : '';
  const candidates = [
    path.resolve(__dirname, `../engine_cpp/build/Release/heat_diffusion_cli${extension}`),
    path.resolve(__dirname, `../engine_cpp/build/heat_diffusion_cli${extension}`),
    path.resolve(__dirname, `../engine_cpp/build/Debug/heat_diffusion_cli${extension}`),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
};

const broadcast = (payload) => {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

const enginePath = resolveEnginePath();
let engineProcess = null;
let engineUnavailableReason = '';

const sendBackendError = (message, ws = null) => {
  const payload = JSON.stringify({ type: 'error', message });

  if (ws) {
    ws.send(payload);
    return;
  }

  broadcast(payload);
};

const startEngine = () => {
  if (!fs.existsSync(enginePath)) {
    engineUnavailableReason = `Engine executable not found at ${enginePath}`;
    console.error(engineUnavailableReason);
    return;
  }

  engineProcess = spawn(enginePath, ['--stdio-server'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stdoutReader = readline.createInterface({ input: engineProcess.stdout });
  stdoutReader.on('line', (line) => {
    const payload = line.trim();
    if (payload) {
      broadcast(payload);
    }
  });

  engineProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString().trim();
    if (text) {
      console.error(`[engine] ${text}`);
    }
  });

  engineProcess.on('error', (error) => {
    engineUnavailableReason = `Failed to start engine: ${error.message}`;
    console.error(engineUnavailableReason);
    sendBackendError(engineUnavailableReason);
  });

  engineProcess.on('exit', (code, signal) => {
    const reason = `Engine process exited (${signal ?? code ?? 'unknown'}).`;
    engineUnavailableReason = reason;
    engineProcess = null;
    console.error(reason);
    sendBackendError(reason);
  });
};

const sendEngineCommand = (command, ws = null) => {
  if (engineUnavailableReason) {
    sendBackendError(engineUnavailableReason, ws);
    return;
  }

  if (!engineProcess || engineProcess.killed || !engineProcess.stdin.writable) {
    sendBackendError('Engine process is not available.', ws);
    return;
  }

  engineProcess.stdin.write(`${command}\n`);
};

const sanitizeNumber = (value, fallback) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeConfig = (raw) => {
  const gridWidth = Math.round(clamp(sanitizeNumber(raw.gridWidth, DEFAULT_GRID_WIDTH), 8, 160));
  const gridHeight = Math.round(clamp(sanitizeNumber(raw.gridHeight, DEFAULT_GRID_HEIGHT), 8, 120));
  const diffusivity = clamp(sanitizeNumber(raw.diffusivity, DEFAULT_DIFFUSIVITY), 0.01, 1.5);
  const timeStep = clamp(sanitizeNumber(raw.timeStep, DEFAULT_TIME_STEP), 0.01, 1.0);
  const boundaryMode = allowedBoundaryModes.has(raw.boundaryMode) ? raw.boundaryMode : 'fixed';
  const initialPattern = allowedInitialPatterns.has(raw.initialPattern)
    ? raw.initialPattern
    : 'center_hotspot';
  const ambientTemperature = clamp(
    sanitizeNumber(raw.ambientTemperature, DEFAULT_AMBIENT_TEMPERATURE),
    -50,
    150,
  );
  const hotspotTemperature = clamp(
    sanitizeNumber(raw.hotspotTemperature, DEFAULT_HOTSPOT_TEMPERATURE),
    ambientTemperature + 1,
    400,
  );

  return {
    gridWidth,
    gridHeight,
    diffusivity,
    timeStep,
    boundaryMode,
    initialPattern,
    ambientTemperature,
    hotspotTemperature,
  };
};

const server = app.listen(port);

server.on('listening', () => {
  console.log(`Heat Diffusion backend listening on port ${port}`);
  console.log(`C++ Engine Path: ${enginePath}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other backend or set PORT.`);
    return;
  }

  console.error('HTTP server failed:', error.message);
});

startEngine();

const wss = new WebSocketServer({ server });

wss.on('error', (error) => {
  console.error('WebSocket server failed:', error.message);
});

wss.on('connection', (ws) => {
  clients.add(ws);

  if (engineUnavailableReason) {
    sendBackendError(engineUnavailableReason, ws);
  } else {
    ws.send(JSON.stringify({ type: 'ready' }));
    sendEngineCommand('REQUEST_STATE', ws);
  }

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message);

      if (payload.type === 'configure') {
        const config = normalizeConfig(payload.data ?? {});
        sendEngineCommand(
          [
            'CONFIG',
            config.gridWidth,
            config.gridHeight,
            config.diffusivity,
            config.timeStep,
            config.boundaryMode,
            config.initialPattern,
            config.ambientTemperature,
            config.hotspotTemperature,
            payload.data?.playing ? 1 : 0,
          ].join('\t'),
          ws,
        );
        return;
      }

      if (payload.type === 'set_playing') {
        sendEngineCommand(`PLAY\t${payload.data?.playing ? 1 : 0}`, ws);
        return;
      }

      if (payload.type === 'reset') {
        sendEngineCommand('RESET', ws);
        return;
      }

      if (payload.type === 'request_state') {
        sendEngineCommand('REQUEST_STATE', ws);
        return;
      }

      sendBackendError('Unknown message type.', ws);
    } catch {
      sendBackendError('Invalid message format. Send JSON.', ws);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

const shutdownEngine = () => {
  if (!engineProcess || engineProcess.killed) {
    return;
  }

  engineProcess.kill();
};

process.on('SIGINT', () => {
  shutdownEngine();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdownEngine();
  process.exit(0);
});
