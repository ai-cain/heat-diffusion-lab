export type BoundaryMode = 'fixed' | 'insulated';
export type InitialPattern = 'center_hotspot' | 'left_wall' | 'checkerboard' | 'ring';

export interface HeatSnapshot {
  revision: number;
  time: number;
  playing: boolean;
  grid_width: number;
  grid_height: number;
  diffusivity: number;
  time_step: number;
  boundary_mode: BoundaryMode;
  initial_pattern: InitialPattern;
  ambient_temperature: number;
  hotspot_temperature: number;
  min_temperature: number;
  max_temperature: number;
  average_temperature: number;
  temperatures: number[];
}
