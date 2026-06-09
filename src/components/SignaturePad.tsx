'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface SignaturePadProps {
  onChange: (base64Data: string) => void;
  height?: number;
  placeholder?: string;
}

export default function SignaturePad({
  onChange,
  height = 120,
  placeholder = 'Tanda tangan di sini'
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas resolution for high DPI displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = height * 2;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Dark color for signature
    ctx.lineWidth = 2.5;
  }, [height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Check if it is a touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if drawing has any pixels (non-empty canvas)
    // We can directly export to data URL
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange('');
  };

  return (
    <div className="relative border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="signature-canvas touch-none block bg-transparent"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {!hasSigned && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-600 text-sm select-none">
          {placeholder}
        </div>
      )}

      {hasSigned && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute bottom-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors shadow-sm"
          title="Hapus tanda tangan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
