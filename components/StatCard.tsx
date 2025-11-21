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
  let bgStatus = 'bg-white';
  let borderStatus = 'border-slate-200';

  if (status === 'warning') {
    bgStatus = 'bg-yellow-50';
    borderStatus = 'border-yellow-200';
  } else if (status === 'critical') {
    bgStatus = 'bg-red-50';
    borderStatus = 'border-red-200';
  }

  return (
    <div className={`${bgStatus} border ${borderStatus} rounded-xl p-6 shadow-sm flex items-start justify-between transition-all duration-300 hover:shadow-md`}>
      <div>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-slate-800">{value}</span>
          {unit && <span className="ml-1 text-slate-500 font-medium">{unit}</span>}
        </div>
        {trend && <p className="mt-2 text-sm text-slate-400">{trend}</p>}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  );
};