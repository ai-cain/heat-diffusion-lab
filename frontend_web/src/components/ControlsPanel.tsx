import type { ReactNode } from 'react';
import type { BoundaryMode, InitialPattern } from '../types';
import { formatBoundaryMode, formatInitialPattern } from '../lib/heatLabMath';

interface ControlsPanelProps {
  isPlaying: boolean;
  canControlPlayback: boolean;
  isRecording: boolean;
  isRecordingSupported: boolean;
  isSocketReady: boolean;
  gridWidth: number;
  gridHeight: number;
  diffusivity: number;
  timeStep: number;
  ambientTemperature: number;
  hotspotTemperature: number;
  boundaryMode: BoundaryMode;
  initialPattern: InitialPattern;
  error: string;
  recordingError: string;
  onTogglePlay: () => void;
  onToggleRecording: () => void;
  onReset: () => void;
  onGridWidthChange: (value: number) => void;
  onGridHeightChange: (value: number) => void;
  onDiffusivityChange: (value: number) => void;
  onTimeStepChange: (value: number) => void;
  onAmbientTemperatureChange: (value: number) => void;
  onHotspotTemperatureChange: (value: number) => void;
  onBoundaryModeChange: (value: BoundaryMode) => void;
  onInitialPatternChange: (value: InitialPattern) => void;
}

interface SliderFieldProps {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  inputDecimals?: number;
  onChange: (value: number) => void;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

interface PanelSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

const SliderField = ({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  inputDecimals = 2,
  onChange,
}: SliderFieldProps) => (
  <div className="slider-field">
    <div className="field-heading">
      <label>{label}</label>
      <span className="field-value">{valueLabel}</span>
    </div>
    <div className="field-controls">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
      <input
        className="value-input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number(value.toFixed(inputDecimals))}
        onChange={(event) => {
          const nextValue = parseFloat(event.target.value);
          if (!Number.isNaN(nextValue)) {
            onChange(nextValue);
          }
        }}
      />
    </div>
  </div>
);

const SelectField = <T extends string,>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) => (
  <div className="select-field">
    <label>{label}</label>
    <select value={value} onChange={(event) => onChange(event.target.value as T)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const PanelSection = ({ eyebrow, title, description, children }: PanelSectionProps) => (
  <section className="panel-section">
    <div className="section-heading">
      <span className="section-eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
    {children}
  </section>
);

function ControlsPanel({
  isPlaying,
  canControlPlayback,
  isRecording,
  isRecordingSupported,
  isSocketReady,
  gridWidth,
  gridHeight,
  diffusivity,
  timeStep,
  ambientTemperature,
  hotspotTemperature,
  boundaryMode,
  initialPattern,
  error,
  recordingError,
  onTogglePlay,
  onToggleRecording,
  onReset,
  onGridWidthChange,
  onGridHeightChange,
  onDiffusivityChange,
  onTimeStepChange,
  onAmbientTemperatureChange,
  onHotspotTemperatureChange,
  onBoundaryModeChange,
  onInitialPatternChange,
}: ControlsPanelProps) {
  return (
    <aside className="controls-panel card">
      <div className="panel-intro">
        <div>
          <span className="section-eyebrow">Controls</span>
          <h2>Diffusion setup</h2>
          <p>Configure the plate, the numerical step, and the initial heat distribution.</p>
        </div>
        <span className={`connection-pill ${isSocketReady ? 'success' : 'warning'}`}>
          {isSocketReady ? 'Engine ready' : 'Engine offline'}
        </span>
      </div>

      <div className="panel-actions">
        <button
          type="button"
          onClick={onTogglePlay}
          className="btn-primary"
          disabled={!canControlPlayback}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary"
          disabled={!canControlPlayback}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onToggleRecording}
          className={isRecording ? 'btn-stop' : 'btn-record'}
          disabled={!isRecordingSupported}
        >
          {isRecording ? 'Stop' : 'Record'}
        </button>
      </div>

      <div className="panel-scroll">
        <PanelSection
          eyebrow="Grid"
          title="Plate resolution"
          description="Higher resolutions look smoother but require more work from the native engine."
        >
          <SliderField
            label="Grid width"
            valueLabel={`${gridWidth} cells`}
            value={gridWidth}
            min={8}
            max={160}
            step={1}
            inputDecimals={0}
            onChange={onGridWidthChange}
          />
          <SliderField
            label="Grid height"
            valueLabel={`${gridHeight} cells`}
            value={gridHeight}
            min={8}
            max={120}
            step={1}
            inputDecimals={0}
            onChange={onGridHeightChange}
          />
        </PanelSection>

        <PanelSection
          eyebrow="Physics"
          title="Diffusion model"
          description="These values control how fast heat spreads and how much simulated time each update advances."
        >
          <SliderField
            label="Diffusivity"
            valueLabel={diffusivity.toFixed(2)}
            value={diffusivity}
            min={0.01}
            max={1.5}
            step={0.01}
            onChange={onDiffusivityChange}
          />
          <SliderField
            label="Time step"
            valueLabel={timeStep.toFixed(2)}
            value={timeStep}
            min={0.01}
            max={1}
            step={0.01}
            onChange={onTimeStepChange}
          />
        </PanelSection>

        <PanelSection
          eyebrow="Boundary"
          title="Boundary and preset"
          description="Pick how the edges behave and how the initial temperature field is seeded."
        >
          <SelectField
            label="Boundary mode"
            value={boundaryMode}
            onChange={onBoundaryModeChange}
            options={[
              { value: 'fixed', label: formatBoundaryMode('fixed') },
              { value: 'insulated', label: formatBoundaryMode('insulated') },
            ]}
          />
          <SelectField
            label="Initial pattern"
            value={initialPattern}
            onChange={onInitialPatternChange}
            options={[
              { value: 'center_hotspot', label: formatInitialPattern('center_hotspot') },
              { value: 'left_wall', label: formatInitialPattern('left_wall') },
              { value: 'checkerboard', label: formatInitialPattern('checkerboard') },
              { value: 'ring', label: formatInitialPattern('ring') },
            ]}
          />
        </PanelSection>

        <PanelSection
          eyebrow="Temperature"
          title="Initial range"
          description="The ambient level fills the plate first, then the selected pattern injects hotter cells."
        >
          <SliderField
            label="Ambient temperature"
            valueLabel={`${ambientTemperature.toFixed(1)} C`}
            value={ambientTemperature}
            min={-50}
            max={150}
            step={0.5}
            inputDecimals={1}
            onChange={onAmbientTemperatureChange}
          />
          <SliderField
            label="Hotspot temperature"
            valueLabel={`${hotspotTemperature.toFixed(1)} C`}
            value={hotspotTemperature}
            min={ambientTemperature + 1}
            max={400}
            step={0.5}
            inputDecimals={1}
            onChange={onHotspotTemperatureChange}
          />
        </PanelSection>

        {recordingError && <div className="error full-width">{recordingError}</div>}
        {error && <div className="error full-width">{error}</div>}
      </div>
    </aside>
  );
}

export default ControlsPanel;
