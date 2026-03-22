import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import ControlsPanel from './components/ControlsPanel';
import {
  DEFAULT_AMBIENT_TEMPERATURE,
  DEFAULT_BOUNDARY_MODE,
  DEFAULT_DIFFUSIVITY,
  DEFAULT_GRID_HEIGHT,
  DEFAULT_GRID_WIDTH,
  DEFAULT_HOTSPOT_TEMPERATURE,
  DEFAULT_INITIAL_PATTERN,
  DEFAULT_TIME_STEP,
  formatBoundaryMode,
  formatInitialPattern,
  getTemperatureColor,
} from './lib/heatLabMath';
import type { BoundaryMode, HeatSnapshot, InitialPattern } from './types';
import './index.css';

const backendWebSocketUrl =
  import.meta.env.VITE_BACKEND_WS_URL?.trim() || 'ws://localhost:3002';

const recordingMimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

const getSupportedRecordingMimeType = () => {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  return recordingMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? '';
};

const drawHeatSnapshot = (canvas: HTMLCanvasElement, snapshot: HeatSnapshot) => {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const cellWidth = width / snapshot.grid_width;
  const cellHeight = height / snapshot.grid_height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#08131f';
  context.fillRect(0, 0, width, height);

  for (let row = 0; row < snapshot.grid_height; row += 1) {
    for (let column = 0; column < snapshot.grid_width; column += 1) {
      const index = row * snapshot.grid_width + column;
      const temperature = snapshot.temperatures[index] ?? snapshot.ambient_temperature;
      context.fillStyle = getTemperatureColor(
        temperature,
        snapshot.ambient_temperature,
        snapshot.hotspot_temperature,
      );
      context.fillRect(
        column * cellWidth,
        row * cellHeight,
        Math.ceil(cellWidth) + 0.5,
        Math.ceil(cellHeight) + 0.5,
      );
    }
  }

  if (cellWidth >= 14 && cellHeight >= 14) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    context.lineWidth = 1;

    for (let column = 1; column < snapshot.grid_width; column += 1) {
      const x = column * cellWidth;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let row = 1; row < snapshot.grid_height; row += 1) {
      const y = row * cellHeight;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }
};

function App() {
  const [gridWidth, setGridWidth] = useState(DEFAULT_GRID_WIDTH);
  const [gridHeight, setGridHeight] = useState(DEFAULT_GRID_HEIGHT);
  const [diffusivity, setDiffusivity] = useState(DEFAULT_DIFFUSIVITY);
  const [timeStep, setTimeStep] = useState(DEFAULT_TIME_STEP);
  const [ambientTemperature, setAmbientTemperature] = useState(DEFAULT_AMBIENT_TEMPERATURE);
  const [hotspotTemperature, setHotspotTemperature] = useState(DEFAULT_HOTSPOT_TEMPERATURE);
  const [boundaryMode, setBoundaryMode] = useState<BoundaryMode>(DEFAULT_BOUNDARY_MODE);
  const [initialPattern, setInitialPattern] = useState<InitialPattern>(DEFAULT_INITIAL_PATTERN);

  const [snapshot, setSnapshot] = useState<HeatSnapshot | null>(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [recordingError, setRecordingError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingUrlRef = useRef<string | null>(null);
  const lastConfigKeyRef = useRef('');
  const isPlayingRef = useRef(isPlaying);
  const pendingPlayTargetRef = useRef<boolean | null>(null);

  const isRecordingSupported =
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype;

  const releaseRecordingUrl = () => {
    if (!recordingUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = null;
  };

  const stopRecorderStream = (recorder: MediaRecorder | null) => {
    recorder?.stream.getTracks().forEach((track) => track.stop());
  };

  const downloadRecording = (blob: Blob) => {
    releaseRecordingUrl();

    const url = URL.createObjectURL(blob);
    recordingUrlRef.current = url;

    const link = document.createElement('a');
    link.href = url;
    link.download = `heat-diffusion-lab-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    link.click();
  };

  const sendSocketMessage = useEffectEvent((payload: unknown) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify(payload));
  });

  const requestPlayingChange = useEffectEvent((nextPlaying: boolean) => {
    pendingPlayTargetRef.current = nextPlaying;
    isPlayingRef.current = nextPlaying;
    setIsPlaying(nextPlaying);

    sendSocketMessage({
      type: 'set_playing',
      data: { playing: nextPlaying },
    });
  });

  useEffect(() => {
    const socket = new WebSocket(backendWebSocketUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      lastConfigKeyRef.current = '';
      pendingPlayTargetRef.current = null;
      setIsSocketReady(true);
      setError('');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'error' || message.error) {
          pendingPlayTargetRef.current = null;
          setError(message.message ?? message.error ?? 'Engine error.');
          return;
        }

        if (message.type === 'state') {
          const nextSnapshot = message.data as HeatSnapshot;
          startTransition(() => {
            setSnapshot(nextSnapshot);
          });

          const pendingPlayTarget = pendingPlayTargetRef.current;

          if (pendingPlayTarget === null) {
            if (isPlayingRef.current !== nextSnapshot.playing) {
              isPlayingRef.current = nextSnapshot.playing;
              setIsPlaying(nextSnapshot.playing);
            }
          } else if (nextSnapshot.playing === pendingPlayTarget) {
            pendingPlayTargetRef.current = null;

            if (isPlayingRef.current !== nextSnapshot.playing) {
              isPlayingRef.current = nextSnapshot.playing;
              setIsPlaying(nextSnapshot.playing);
            }
          }

          setError('');
        }
      } catch {
        setError('Invalid output from engine.');
      }
    };

    socket.onclose = () => {
      lastConfigKeyRef.current = '';
      pendingPlayTargetRef.current = null;
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsSocketReady(false);
    };

    return () => {
      lastConfigKeyRef.current = '';
      pendingPlayTargetRef.current = null;
      isPlayingRef.current = false;
      setIsSocketReady(false);
      socket.close();
    };
  }, []);

  useEffect(
    () => () => {
      releaseRecordingUrl();

      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      recordedChunksRef.current = [];

      if (!recorder) {
        return;
      }

      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }

      stopRecorderStream(recorder);
    },
    [],
  );

  useEffect(() => {
    if (!isSocketReady) {
      return;
    }

    const configKey = JSON.stringify({
      gridWidth,
      gridHeight,
      diffusivity,
      timeStep,
      boundaryMode,
      initialPattern,
      ambientTemperature,
      hotspotTemperature,
      playing: isPlayingRef.current,
    });

    if (lastConfigKeyRef.current === configKey) {
      return;
    }

    lastConfigKeyRef.current = configKey;

    sendSocketMessage({
      type: 'configure',
      data: {
        gridWidth,
        gridHeight,
        diffusivity,
        timeStep,
        boundaryMode,
        initialPattern,
        ambientTemperature,
        hotspotTemperature,
        playing: isPlayingRef.current,
      },
    });
  }, [
    ambientTemperature,
    boundaryMode,
    diffusivity,
    gridHeight,
    gridWidth,
    hotspotTemperature,
    initialPattern,
    isSocketReady,
    sendSocketMessage,
    timeStep,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!snapshot) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    drawHeatSnapshot(canvas, snapshot);
  }, [snapshot]);

  const handleAmbientTemperatureChange = (value: number) => {
    setAmbientTemperature(value);
    setHotspotTemperature((currentValue) => Math.max(currentValue, value + 1));
  };

  const handleHotspotTemperatureChange = (value: number) => {
    setHotspotTemperature(Math.max(value, ambientTemperature + 1));
  };

  const handleReset = () => {
    pendingPlayTargetRef.current = false;
    isPlayingRef.current = false;
    setIsPlaying(false);
    sendSocketMessage({ type: 'reset' });
    sendSocketMessage({ type: 'set_playing', data: { playing: false } });
  };

  const handleToggleRecording = () => {
    const currentRecorder = mediaRecorderRef.current;

    if (currentRecorder && currentRecorder.state !== 'inactive') {
      currentRecorder.stop();
      return;
    }

    if (!isRecordingSupported) {
      setRecordingError('Recording is not supported in this browser.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setRecordingError('Canvas is not ready yet.');
      return;
    }

    const mimeType = getSupportedRecordingMimeType();

    try {
      const stream = canvas.captureStream(30);
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      setRecordingError('');

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setRecordingError('Recording failed while capturing the heatmap canvas.');
        setIsRecording(false);
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        stopRecorderStream(recorder);
      };

      recorder.onstop = () => {
        const blob =
          recordedChunksRef.current.length > 0
            ? new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' })
            : null;

        if (blob) {
          downloadRecording(blob);
        }

        setIsRecording(false);
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        stopRecorderStream(recorder);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch {
      setRecordingError('The browser could not start recording the heatmap canvas.');
      setIsRecording(false);
    }
  };

  const stageStatusLabel = !isSocketReady
    ? 'Engine offline'
    : snapshot
      ? snapshot.playing
        ? 'Streaming state'
        : 'Ready to step'
      : 'Awaiting engine state';
  const canControlPlayback = isSocketReady && snapshot !== null;

  const metricCards = [
    {
      label: 'Grid',
      value: `${gridWidth} x ${gridHeight}`,
    },
    {
      label: 'Diffusivity',
      value: diffusivity.toFixed(2),
    },
    {
      label: 'Boundary',
      value: formatBoundaryMode(boundaryMode),
    },
    {
      label: 'Preset',
      value: formatInitialPattern(initialPattern),
    },
  ];

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Heat Diffusion</span>
          <h1>Heat Diffusion Lab</h1>
          <p>
            Native C++ engine streaming a 2D temperature field to a lightweight web UI.
          </p>
        </div>

        <div className="hero-metrics">
          {metricCards.map((metric) => (
            <article key={metric.label} className="metric-card">
              <span className="metric-label">{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      </header>

      <main className="workspace">
        <section className="stage-panel card">
          <div className="stage-header">
            <div>
              <span className="section-eyebrow">Live View</span>
              <h2>Temperature field</h2>
              <p className="canvas-caption">
                Colors track the plate temperature from the ambient baseline to the injected hotspot.
              </p>
            </div>

            <div className="stage-badges">
              {isRecording && <span className="status-pill recording">Recording</span>}
              <span className={`status-pill ${isPlaying ? 'active' : ''}`}>
                {isPlaying ? 'Running' : 'Paused'}
              </span>
              <span className={`status-pill ${!isSocketReady ? 'warning' : 'success'}`}>
                {stageStatusLabel}
              </span>
            </div>
          </div>

          <div className="canvas-frame heat-frame">
            <canvas ref={canvasRef} width={900} height={600}></canvas>
          </div>

          <div className="legend-panel">
            <div className="legend-bar"></div>
            <div className="legend-scale">
              <span>{ambientTemperature.toFixed(1)} C</span>
              <span>{hotspotTemperature.toFixed(1)} C</span>
            </div>
          </div>

          <div className="status-grid">
            <article className="mini-stat">
              <span>Sim time</span>
              <strong>{snapshot ? snapshot.time.toFixed(2) : '0.00'}</strong>
            </article>
            <article className="mini-stat">
              <span>Min temp</span>
              <strong>{snapshot ? `${snapshot.min_temperature.toFixed(1)} C` : '--'}</strong>
            </article>
            <article className="mini-stat">
              <span>Avg temp</span>
              <strong>{snapshot ? `${snapshot.average_temperature.toFixed(1)} C` : '--'}</strong>
            </article>
            <article className="mini-stat">
              <span>Max temp</span>
              <strong>{snapshot ? `${snapshot.max_temperature.toFixed(1)} C` : '--'}</strong>
            </article>
          </div>
        </section>

        <ControlsPanel
          isPlaying={isPlaying}
          canControlPlayback={canControlPlayback}
          isRecording={isRecording}
          isRecordingSupported={isRecordingSupported}
          isSocketReady={isSocketReady}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          diffusivity={diffusivity}
          timeStep={timeStep}
          ambientTemperature={ambientTemperature}
          hotspotTemperature={hotspotTemperature}
          boundaryMode={boundaryMode}
          initialPattern={initialPattern}
          error={error}
          recordingError={recordingError}
          onTogglePlay={() => requestPlayingChange(!isPlayingRef.current)}
          onToggleRecording={handleToggleRecording}
          onReset={handleReset}
          onGridWidthChange={setGridWidth}
          onGridHeightChange={setGridHeight}
          onDiffusivityChange={setDiffusivity}
          onTimeStepChange={setTimeStep}
          onAmbientTemperatureChange={handleAmbientTemperatureChange}
          onHotspotTemperatureChange={handleHotspotTemperatureChange}
          onBoundaryModeChange={setBoundaryMode}
          onInitialPatternChange={setInitialPattern}
        />
      </main>
    </div>
  );
}

export default App;
