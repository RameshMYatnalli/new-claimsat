import React from 'react';
interface ScoreDisplayProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, label = 'Score', size = 'md' }) => {
  const getColorClass = (score: number): string => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'lg':
        return 'text-2xl px-6 py-3';
      default:
        return 'text-lg px-4 py-2';
    }
  };
  return (
    <div className="inline-flex flex-col items-center">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <div className={`font-bold rounded-lg border-2 ${getColorClass(score)} ${getSizeClasses()}`}>
        {score.toFixed(1)}
      </div>
    </div>
  );
};
export default ScoreDisplay;