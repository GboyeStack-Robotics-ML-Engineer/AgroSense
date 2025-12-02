import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color: string; // Tailwind text color class like 'text-blue-500'
  trend?: string; // e.g. "+5%"
  status?: 'normal' | 'warning' | 'critical';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon: Icon, color, trend, status = 'normal' }) => {
  let bgStatus = 'bg-white dark:bg-slate-900';
  let borderStatus = 'border-slate-200 dark:border-slate-800';

  if (status === 'warning') {
    bgStatus = 'bg-yellow-50 dark:bg-yellow-900/20';
    borderStatus = 'border-yellow-200 dark:border-yellow-700/50';
  } else if (status === 'critical') {
    bgStatus = 'bg-red-50 dark:bg-red-900/20';
    borderStatus = 'border-red-200 dark:border-red-700/50';
  }

  return (
    <div className={`${bgStatus} border ${borderStatus} rounded-xl p-6 shadow-sm flex items-start justify-between transition-all duration-300 hover:shadow-md`}>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
          {unit && <span className="ml-1 text-slate-500 dark:text-slate-400 font-medium">{unit}</span>}
        </div>
        {trend && <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{trend}</p>}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  );
};