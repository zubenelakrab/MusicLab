import { useRef, useCallback, useState } from 'react';

export default function Knob({ label, value, onChange, min = 0, max = 100, size = 60 }) {
  const knobRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // Ensure value is a valid number
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : min;
  const percentage = ((safeValue - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135;

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = safeValue;

    const handleMouseMove = (e) => {
      const delta = startY.current - e.clientY;
      const range = max - min;
      const newValue = Math.min(max, Math.max(min, startValue.current + (delta / 100) * range));
      onChange(Math.round(newValue * 100) / 100);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [safeValue, min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        className={`relative rounded-full bg-studio-700 border-2 cursor-pointer select-none ${
          isDragging ? 'border-accent-primary' : 'border-studio-500'
        }`}
        style={{ width: size, height: size }}
      >
        <div
          className="absolute top-1/2 left-1/2 w-1 h-1/3 bg-accent-primary rounded-full origin-bottom"
          style={{
            transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-mono">
          {Math.round(safeValue)}
        </div>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
