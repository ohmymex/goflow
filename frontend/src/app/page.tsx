'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useVisualizer } from '@/hooks/useVisualizer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CodeEditor, DEFAULT_CODE } from '@/components/CodeEditor';
import { VariableTracker } from '@/components/VariableTracker';
import { ExecutionControls } from '@/components/ExecutionControls';
import { ConsoleOutput } from '@/components/ConsoleOutput';
import { EmptyFlowCanvas } from '@/components/FlowCanvas';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { CodeExamplesDropdown } from '@/components/CodeExamplesDropdown';
import { ExportButton } from '@/components/ExportButton';
import { Variable } from '@/types/trace';

// Dynamic import for FlowCanvas to avoid SSR issues with React Flow
const FlowCanvas = dynamic(
  () => import('@/components/FlowCanvas').then((mod) => mod.FlowCanvas),
  { 
    ssr: false,
    loading: () => <EmptyFlowCanvas />
  }
);

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [previousVariables, setPreviousVariables] = useState<Variable[]>([]);
  const prevStepRef = useRef<number>(0);
  
  const {
    isLoading,
    error,
    traceData,
    currentStep,
    isPlaying,
    playSpeed,
    currentTraceStep,
    currentVariables,
    currentLine,
    outputUpToCurrentStep,
    executeCode,
    goToStep,
    nextStep,
    prevStep,
    goToStart,
    goToEnd,
    togglePlay,
    pause,
    setPlaySpeed,
    reset,
  } = useVisualizer();

  // Track previous variables for change detection
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      setPreviousVariables(
        traceData?.trace[prevStepRef.current]?.variables || []
      );
      prevStepRef.current = currentStep;
    }
  }, [currentStep, traceData]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !traceData) return;

    const timer = setInterval(() => {
      nextStep();
    }, playSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, nextStep, traceData]);

  // Stop playing when reaching the end
  useEffect(() => {
    if (isPlaying && traceData && currentStep >= traceData.totalSteps - 1) {
      pause();
    }
  }, [currentStep, traceData, isPlaying, pause]);

  const handleVisualize = useCallback(() => {
    executeCode(code);
  }, [code, executeCode]);

  const handleReset = useCallback(() => {
    reset();
    setCode(DEFAULT_CODE);
    setPreviousVariables([]);
    prevStepRef.current = 0;
  }, [reset]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: traceData ? togglePlay : undefined,
    onNextStep: traceData ? nextStep : undefined,
    onPrevStep: traceData ? prevStep : undefined,
    onGoToStart: traceData ? goToStart : undefined,
    onGoToEnd: traceData ? goToEnd : undefined,
    onReset: traceData ? handleReset : undefined,
    enabled: !!traceData,
  });

  return (
    <div className="min-h-screen bg-base-200 flex flex-col" data-theme="dark">
      {/* Header */}
      <header className="navbar bg-base-100 border-b border-base-300 px-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            GoFlow
          </h1>
          <span className="ml-2 text-sm text-base-content/60">Interactive Go Code Visualizer</span>
        </div>
        <div className="flex-none flex gap-2 items-center">
          <CodeExamplesDropdown onSelect={setCode} />
          <KeyboardShortcutsHelp />
          <ExportButton traceData={traceData} />
          {traceData && (
            <button
              onClick={handleReset}
              className="btn btn-ghost btn-outline"
              title="Reset to default code (Shift+R)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          )}
          <button
            onClick={handleVisualize}
            disabled={isLoading}
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Visualize
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mx-4 mt-4">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Column - Code Editor */}
        <div className="flex flex-col gap-4 min-h-[600px]">
          <div className="card bg-base-100 shadow-xl flex-1">
            <div className="card-body p-0 overflow-hidden">
              <div className="px-4 py-2 border-b border-base-300 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code Editor
                </h2>
                {currentTraceStep && (
                  <span className="badge badge-primary badge-sm">
                    Line {currentLine}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-[400px]">
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  highlightLine={traceData ? currentLine : undefined}
                  readOnly={isPlaying}
                />
              </div>
            </div>
          </div>

          {/* Console Output */}
          <div className="card bg-base-100 shadow-xl h-[150px]">
            <div className="card-body p-0 overflow-hidden">
              <ConsoleOutput output={outputUpToCurrentStep} />
            </div>
          </div>
        </div>

        {/* Right Column - Visualization & Controls */}
        <div className="flex flex-col gap-4 min-h-[600px]">
          {/* Flow Canvas */}
          <div className="card bg-base-100 shadow-xl flex-1">
            <div className="card-body p-0 overflow-hidden">
              <div className="px-4 py-2 border-b border-base-300">
                <h2 className="font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  Execution Flow
                </h2>
              </div>
              <div className="flex-1 min-h-[300px]">
                {traceData ? (
                  <FlowCanvas
                    astNodes={traceData.ast.nodes}
                    currentStep={currentTraceStep}
                    currentLine={currentLine}
                  />
                ) : (
                  <EmptyFlowCanvas />
                )}
              </div>
            </div>
          </div>

          {/* Variable Tracker */}
          <div className="card bg-base-100 shadow-xl h-[200px]">
            <div className="card-body p-0 overflow-hidden">
              <div className="px-4 py-2 border-b border-base-300">
                <h2 className="font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                  </svg>
                  Variable State
                  {currentTraceStep?.callStack && currentTraceStep.callStack.length > 1 && (
                    <span className="badge badge-accent badge-sm ml-2" title="Call stack">
                      {currentTraceStep.callStack.join(' → ')}
                    </span>
                  )}
                  {currentTraceStep?.loopIteration && (
                    <span className="badge badge-secondary badge-sm ml-2">
                      {currentTraceStep.loopIteration.loopId} iter #{currentTraceStep.loopIteration.iteration}
                    </span>
                  )}
                </h2>
              </div>
              <VariableTracker
                variables={currentVariables}
                previousVariables={previousVariables}
              />
            </div>
          </div>

          {/* Execution Controls */}
          {traceData && (
            <ExecutionControls
              currentStep={currentStep}
              totalSteps={traceData.totalSteps}
              isPlaying={isPlaying}
              playSpeed={playSpeed}
              onPrevStep={prevStep}
              onNextStep={nextStep}
              onGoToStart={goToStart}
              onGoToEnd={goToEnd}
              onTogglePlay={togglePlay}
              onSpeedChange={setPlaySpeed}
              onStepChange={goToStep}
              disabled={!traceData}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-100 text-base-content border-t border-base-300">
        <p className="text-sm text-base-content/60">
          GoFlow - Visualize Go code execution step by step
        </p>
      </footer>
    </div>
  );
}
