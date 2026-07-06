import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  accentColor?: string;
}

/** Dashboard summary card showing a single KPI (e.g. "Uploads Today: 12"). */
export function StatCard({ label, value, icon, trend, accentColor = 'var(--color-primary)' }: StatCardProps) {
  return (
    <div className="card" style={{ padding: 18, flex: 1, minWidth: 160 }}>
      <div className="flex items-center justify-between">
        <span className="text-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.04 }}>
          {label}
        </span>
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 10,
              background: `${accentColor}1a`,
              color: accentColor,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>{value}</div>
      {trend && (
        <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
          {trend}
        </div>
      )}
    </div>
  );
}
