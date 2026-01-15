'use client';

import { TraceResponse } from '@/types/trace';

interface ExportButtonProps {
  traceData: TraceResponse | null;
}

export function ExportButton({ traceData }: ExportButtonProps) {
  const handleExport = () => {
    if (!traceData) return;

    // Create export data with timestamp
    const exportData = {
      exportedAt: new Date().toISOString(),
      ...traceData,
    };

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `goflow-trace-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!traceData) return null;

  return (
    <button
      onClick={handleExport}
      className="btn btn-ghost btn-sm gap-2"
      title="Export trace as JSON"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </button>
  );
}
