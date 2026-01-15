'use client';

import { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  highlightLine?: number;
  readOnly?: boolean;
}

const DEFAULT_CODE = `package main

import "fmt"

func main() {
	// Simple nested loop example
	for i := 0; i < 3; i++ {
		for j := 0; j < 2; j++ {
			fmt.Println(i, j)
		}
	}
}
`;

export function CodeEditor({
  code,
  onChange,
  highlightLine,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange: OnChange = (value) => {
    onChange(value || '');
  };

  // Update line highlighting when highlightLine changes
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    // If no line to highlight, just clear and return
    if (!highlightLine) return;

    // Add new decoration for highlighted line
    decorationsRef.current = editor.deltaDecorations([], [
      {
        range: {
          startLineNumber: highlightLine,
          startColumn: 1,
          endLineNumber: highlightLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'bg-primary/20',
          glyphMarginClassName: 'bg-primary',
        },
      },
    ]);

    // Scroll to the highlighted line
    editor.revealLineInCenter(highlightLine);
  }, [highlightLine]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-base-300">
      <Editor
        height="100%"
        defaultLanguage="go"
        value={code || DEFAULT_CODE}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: false,
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          roundedSelection: true,
          cursorStyle: 'line',
          wordWrap: 'off',
        }}
      />
    </div>
  );
}

export { DEFAULT_CODE };
