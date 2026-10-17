import React from 'react';
import { SeverityLevel } from '../../types/scan';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface Props {
  severity: SeverityLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'sm', showIcon = true }) => {
  const norm = (severity || 'INFO').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Info;

  if (norm === 'CRITICAL') {
    styles = 'bg-red-100 text-red-800 border-red-200';
    Icon = ShieldAlert;
  } else if (norm === 'HIGH') {
    styles = 'bg-orange-100 text-orange-800 border-orange-200';
    Icon = AlertCircle;
  } else if (norm === 'MEDIUM') {
    styles = 'bg-amber-100 text-amber-800 border-amber-200';
    Icon = AlertTriangle;
  } else if (norm === 'LOW') {
    styles = 'bg-blue-100 text-blue-800 border-blue-200';
    Icon = Info;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-wide uppercase ${styles} ${sizeClasses}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{norm}</span>
    </span>
  );
};
