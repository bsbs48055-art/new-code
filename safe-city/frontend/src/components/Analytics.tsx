import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { Violation, Camera as CameraType } from "../types";
import { format, parseISO, startOfHour } from "date-fns";

interface Props {
  violations: Violation[];
  cameras: CameraType[];
}

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899"];

const CHART_STYLE = {
  background: "transparent",
  fontSize: 11,
  fill: "#94a3b8",
};

export default function Analytics({ violations, cameras }: Props) {
  const camMap = useMemo(() =>
    Object.fromEntries(cameras.map(c => [c.id, c.name])), [cameras]);

  // Violations per hour (last 24h)
  const hourlyData = useMemo(() => {
    const buckets: Record<string, number> = {};
    violations.forEach(v => {
      try {
        const h = format(startOfHour(new Date(v.timestamp)), "HH:mm");
        buckets[h] = (buckets[h] || 0) + 1;
      } catch {}
    });
    return Object.entries(buckets).map(([hour, count]) => ({ hour, count }));
  }, [violations]);

  // By camera
  const byCam = useMemo(() => {
    const m: Record<string, number> = {};
    violations.forEach(v => { m[v.camera_id] = (m[v.camera_id] || 0) + 1; });
    return Object.entries(m).map(([id, count]) => ({ name: camMap[id] || id, count }))
      .sort((a, b) => b.count - a.count);
  }, [violations, camMap]);

  // By vehicle type
  const byClass = useMemo(() => {
    const m: Record<string, number> = {};
    violations.forEach(v => { m[v.vehicle_class] = (m[v.vehicle_class] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [violations]);

  // Speed distribution
  const speedDist = useMemo(() => {
    const buckets: Record<string, number> = {};
    violations.forEach(v => {
      const bucket = `${Math.floor(v.detected_speed / 10) * 10}–${Math.floor(v.detected_speed / 10) * 10 + 9}`;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range));
  }, [violations]);

  // Top stats
  const maxSpeed = Math.max(0, ...violations.map(v => v.detected_speed));
  const avgOver = violations.length
    ? violations.reduce((s, v) => s + v.overspeed_by, 0) / violations.length
    : 0;
  const worstCam = byCam[0];

  const statCards = [
    { label: "Total Violations", value: violations.length, color: "text-red-400" },
    { label: "Highest Speed", value: maxSpeed > 0 ? `${maxSpeed.toFixed(0)} km/h` : "—", color: "text-orange-400" },
    { label: "Avg Over Limit", value: avgOver > 0 ? `+${avgOver.toFixed(1)} km/h` : "—", color: "text-yellow-400" },
    { label: "Most Violations", value: worstCam ? worstCam.name : "—", color: "text-blue-400" },
  ];

  return (
    <div className="p-4 space-y-5 overflow-auto">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Violations per hour */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Violations by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData} {...CHART_STYLE}>
              <defs>
                <linearGradient id="violGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#violGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By camera */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Violations by Camera</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCam} layout="vertical" {...CHART_STYLE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} width={90} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Speed distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Speed Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={speedDist} {...CHART_STYLE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {speedDist.map((_, i) => (
                  <Cell key={i} fill={`hsl(${Math.max(0, 120 - i * 15)}, 80%, 50%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By vehicle type (pie) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Vehicle Type Breakdown</h3>
          {byClass.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={byClass}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byClass.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-600 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
