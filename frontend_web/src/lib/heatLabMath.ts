import type { BoundaryMode, InitialPattern } from '../types';

export const DEFAULT_GRID_WIDTH = 48;
export const DEFAULT_GRID_HEIGHT = 32;
export const DEFAULT_DIFFUSIVITY = 0.18;
export const DEFAULT_TIME_STEP = 0.12;
export const DEFAULT_AMBIENT_TEMPERATURE = 18;
export const DEFAULT_HOTSPOT_TEMPERATURE = 90;
export const DEFAULT_BOUNDARY_MODE: BoundaryMode = 'fixed';
export const DEFAULT_INITIAL_PATTERN: InitialPattern = 'center_hotspot';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const interpolateChannel = (from: number, to: number, t: number) =>
  Math.round(from + (to - from) * t);

export const getTemperatureColor = (
  value: number,
  minTemperature: number,
  maxTemperature: number,
) => {
  const span = Math.max(maxTemperature - minTemperature, 1e-6);
  const normalized = clamp((value - minTemperature) / span, 0, 1);

  if (normalized < 0.25) {
    const localT = normalized / 0.25;
    return `rgb(${interpolateChannel(18, 44, localT)}, ${interpolateChannel(43, 120, localT)}, ${interpolateChannel(94, 191, localT)})`;
  }

  if (normalized < 0.5) {
    const localT = (normalized - 0.25) / 0.25;
    return `rgb(${interpolateChannel(44, 77, localT)}, ${interpolateChannel(120, 196, localT)}, ${interpolateChannel(191, 255, localT)})`;
  }

  if (normalized < 0.75) {
    const localT = (normalized - 0.5) / 0.25;
    return `rgb(${interpolateChannel(77, 243, localT)}, ${interpolateChannel(196, 195, localT)}, ${interpolateChannel(255, 69, localT)})`;
  }

  const localT = (normalized - 0.75) / 0.25;
  return `rgb(${interpolateChannel(243, 208, localT)}, ${interpolateChannel(195, 45, localT)}, ${interpolateChannel(69, 55, localT)})`;
};

export const formatBoundaryMode = (boundaryMode: BoundaryMode) =>
  boundaryMode === 'fixed' ? 'Fixed edge' : 'Insulated edge';

export const formatInitialPattern = (initialPattern: InitialPattern) => {
  switch (initialPattern) {
    case 'center_hotspot':
      return 'Center hotspot';
    case 'left_wall':
      return 'Left wall';
    case 'checkerboard':
      return 'Checkerboard';
    case 'ring':
      return 'Hot ring';
    default:
      return initialPattern;
  }
};
