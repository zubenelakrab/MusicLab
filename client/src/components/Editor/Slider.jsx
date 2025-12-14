export default function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) {
  // Ensure value is a valid number
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : min;
  const percentage = ((safeValue - min) / (max - min)) * 100;

  // Format display value
  const displayValue = Number.isInteger(safeValue) ? safeValue : safeValue.toFixed(2);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{displayValue}{unit}</span>
      </div>
      <div className="relative h-2 bg-studio-600 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-accent-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          value={safeValue}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
