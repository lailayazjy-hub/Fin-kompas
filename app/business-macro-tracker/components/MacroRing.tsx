import React from 'react';

interface MacroRingProps {
  label: string;
  percentage: number; // 0 to 100 (or more)
  colorClass: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MacroRing: React.FC<MacroRingProps> = ({ label, percentage, colorClass, subLabel, size = 'md' }) => {
  const radius = 35;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-24 h-24 text-sm',
    lg: 'w-32 h-32 text-base',
  };

  // Determine if over budget
  const isOver = percentage > 100;
  const displayColor = isOver ? 'text-red-500' : colorClass;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        <svg
          height="100%"
          width="100%"
          viewBox="0 0 70 70"
          className="transform -rotate-90 overflow-visible"
        >
          {/* Background Ring */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="35"
            cy="35"
            className="text-slate-800"
          />
          {/* Progress Ring */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx="35"
            cy="35"
            className={`${displayColor} drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
          <span className={`font-bold ${displayColor}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="text-slate-400 text-xs uppercase tracking-wide font-semibold">{label}</div>
        {subLabel && <div className="text-slate-500 text-[10px]">{subLabel}</div>}
      </div>
    </div>
  );
};

export default MacroRing;
