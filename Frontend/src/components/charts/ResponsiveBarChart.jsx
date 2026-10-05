import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ResponsiveBarChart({ data, xKey, yKey }) {
  // Read theme colors from CSS variables
  const theme = useMemo(() => {
    if (typeof document === 'undefined') return {};
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      primary: computedStyle.getPropertyValue('--theme-primary').trim() || '#6366f1',
      accent: computedStyle.getPropertyValue('--theme-accent').trim() || '#06b6d4',
      border: computedStyle.getPropertyValue('--theme-border').trim() || '#334155',
      text: computedStyle.getPropertyValue('--theme-text').trim() || '#ffffff',
      surface: computedStyle.getPropertyValue('--theme-surface').trim() || '#1e293b',
      muted: computedStyle.getPropertyValue('--theme-muted').trim() || '#475569',
    };
  }, []);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
        <XAxis 
          dataKey={xKey} 
          stroke={theme.muted} 
          tick={{ fill: theme.muted, fontSize: 12 }} 
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke={theme.muted} 
          tick={{ fill: theme.muted, fontSize: 12 }} 
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme.surface, 
            borderColor: theme.border, 
            color: theme.text,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          itemStyle={{ color: theme.text }}
          cursor={{ fill: theme.muted, opacity: 0.1 }}
        />
        <Bar dataKey={yKey} fill={theme.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
