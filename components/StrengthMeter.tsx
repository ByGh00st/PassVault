import React, { useMemo } from 'react';

interface StrengthMeterProps {
  password?: string;
}

const StrengthMeter: React.FC<StrengthMeterProps> = ({ password = '' }) => {
  const strength = useMemo(() => {
    let score = 0;
    if (!password) return 0;
    
    if (password.length > 8) score += 1;
    if (password.length > 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return Math.min(score, 5); // Max 5
  }, [password]);

  const getColor = (s: number) => {
    switch(s) {
      case 0: return 'bg-gray-700';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-700';
    }
  };

  const getLabel = (s: number) => {
    switch(s) {
      case 0: return 'Empty';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400">Strength: {getLabel(strength)}</span>
      </div>
      <div className="flex gap-1 h-1.5 w-full">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-all duration-300 ${
              strength >= level ? getColor(strength) : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StrengthMeter;