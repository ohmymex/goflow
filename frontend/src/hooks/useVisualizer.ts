'use client';

import { useState, useCallback, useMemo } from 'react';
import { TraceResponse, TraceStep, Variable } from '@/types/trace';
import { traceCode } from '@/lib/api';

export interface VisualizerState {
  isLoading: boolean;
  error: string | null;
  traceData: TraceResponse | null;
  currentStep: number;
  isPlaying: boolean;
  playSpeed: number; // ms between steps
}

export function useVisualizer() {
  const [state, setState] = useState<VisualizerState>({
    isLoading: false,
    error: null,
    traceData: null,
    currentStep: 0,
    isPlaying: false,
    playSpeed: 500,
  });

  // Execute code and get trace
  const executeCode = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await traceCode(code);
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      setState(prev => ({
        ...prev,
        isLoading: false,
        traceData: data,
        currentStep: 0,
        isPlaying: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to execute code',
      }));
    }
  }, []);

  // Navigation controls
  const goToStep = useCallback((step: number) => {
    setState(prev => {
      if (!prev.traceData) return prev;
      const maxStep = prev.traceData.totalSteps - 1;
      const newStep = Math.max(0, Math.min(step, maxStep));
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (!prev.traceData) return prev;
      const maxStep = prev.traceData.totalSteps - 1;
      if (prev.currentStep >= maxStep) {
        return { ...prev, isPlaying: false };
      }
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      if (!prev.traceData || prev.currentStep <= 0) return prev;
      return { ...prev, currentStep: prev.currentStep - 1 };
    });
  }, []);

  const goToStart = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 0, isPlaying: false }));
  }, []);

  const goToEnd = useCallback(() => {
    setState(prev => {
      if (!prev.traceData) return prev;
      return {
        ...prev,
        currentStep: prev.traceData.totalSteps - 1,
        isPlaying: false,
      };
    });
  }, []);

  // Playback controls
  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setPlaySpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playSpeed: speed }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      traceData: null,
      currentStep: 0,
      isPlaying: false,
      playSpeed: 500,
    });
  }, []);

  // Derived state
  const currentTraceStep: TraceStep | null = useMemo(() => {
    if (!state.traceData || state.traceData.trace.length === 0) return null;
    return state.traceData.trace[state.currentStep] || null;
  }, [state.traceData, state.currentStep]);

  const currentVariables: Variable[] = useMemo(() => {
    return currentTraceStep?.variables || [];
  }, [currentTraceStep]);

  const currentLine: number = useMemo(() => {
    return currentTraceStep?.line || 0;
  }, [currentTraceStep]);

  const outputUpToCurrentStep: string = useMemo(() => {
    if (!state.traceData) return '';
    return state.traceData.trace
      .slice(0, state.currentStep + 1)
      .map(step => step.output || '')
      .join('');
  }, [state.traceData, state.currentStep]);

  return {
    // State
    ...state,
    currentTraceStep,
    currentVariables,
    currentLine,
    outputUpToCurrentStep,

    // Actions
    executeCode,
    goToStep,
    nextStep,
    prevStep,
    goToStart,
    goToEnd,
    play,
    pause,
    togglePlay,
    setPlaySpeed,
    reset,
  };
}
