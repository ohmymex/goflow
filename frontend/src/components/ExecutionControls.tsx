'use client';

interface ExecutionControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  playSpeed: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onStepChange: (step: number) => void;
  disabled?: boolean;
}

const SPEED_OPTIONS = [
  { label: '0.5x', value: 1000 },
  { label: '1x', value: 500 },
  { label: '2x', value: 250 },
  { label: '4x', value: 125 },
];

export function ExecutionControls({
  currentStep,
  totalSteps,
  isPlaying,
  playSpeed,
  onPrevStep,
  onNextStep,
  onGoToStart,
  onGoToEnd,
  onTogglePlay,
  onSpeedChange,
  onStepChange,
  disabled = false,
}: ExecutionControlsProps) {
  const isAtStart = currentStep === 0;
  const isAtEnd = currentStep >= totalSteps - 1;

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-lg border border-base-300">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-base-content/60 min-w-[80px]">
          Step {currentStep + 1} / {totalSteps}
        </span>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="range range-primary range-sm flex-1"
          disabled={disabled || totalSteps === 0}
        />
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2">
        {/* Go to start */}
        <button
          onClick={onGoToStart}
          disabled={disabled || isAtStart}
          className="btn btn-sm btn-ghost"
          title="Go to start"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Previous step */}
        <button
          onClick={onPrevStep}
          disabled={disabled || isAtStart}
          className="btn btn-sm btn-ghost"
          title="Previous step"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          disabled={disabled || isAtEnd}
          className={`btn btn-circle ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          )}
        </button>

        {/* Next step */}
        <button
          onClick={onNextStep}
          disabled={disabled || isAtEnd}
          className="btn btn-sm btn-ghost"
          title="Next step"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Go to end */}
        <button
          onClick={onGoToEnd}
          disabled={disabled || isAtEnd}
          className="btn btn-sm btn-ghost"
          title="Go to end"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Speed control */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-base-content/60">Speed:</span>
        <div className="join">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSpeedChange(option.value)}
              className={`join-item btn btn-xs ${playSpeed === option.value ? 'btn-primary' : 'btn-ghost'}`}
              disabled={disabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
