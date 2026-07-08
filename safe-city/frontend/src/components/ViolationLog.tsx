import React, { useState, useMemo } from "react";
import { AlertTriangle, Search, Filter, Download, ChevronDown } from "lucide-react";
import { Violation, Camera as CameraType } from "../types";
import { format } from "date-fns";

interface Props {
  violations: Violation[];
  cameras: CameraType[];
}

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function severityColor(over: number) {
  if (over > 50) return "text-red-400 bg-red-950/50";
  if (over > 20) return "text-orange-400 bg-orange-950/50";
  return "text-yellow-400 bg-yellow-950/50";
}

export default function ViolationLog({ violations, cameras }: Props) {
  const [search, setSearch] = useState("");
  const [filterCam, setFilterCam] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [sortKey, setSortKey] = useState<"timestamp" | "speed">("timestamp");

  const camMap = useMemo(() => Object.fromEntries(cameras.map(c => [c.id, c.name])), [cameras]);
  const classes = useMemo(() => [...new Set(violations.map(v => v.vehicle_class))], [violations]);

  const filtered = useMemo(() => {
    return violations
      .filter(v => {
        if (filterCam !== "all" && v.camera_id !== filterCam) return false;
        if (filterClass !== "all" && v.vehicle_class !== filterClass) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            v.camera_id.includes(s) ||
            (camMap[v.camera_id] || "").toLowerCase().includes(s) ||
            v.vehicle_class.includes(s) ||
            (v.license_plate || "").toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "speed") return b.detected_speed - a.detected_speed;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [violations, filterCam, filterClass, search, sortKey, camMap]);

  const exportCsv = () => {
    const header = "timestamp,camera,vehicle,speed,limit,over_by,plate";
    const rows = filtered.map(v =>
      [v.timestamp, camMap[v.camera_id] || v.camera_id, v.vehicle_class,
       v.detected_speed, v.speed_limit, v.overspeed_by, v.license_plate || ""].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "violations.csv"; a.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded pl-7 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-44"
          />
        </div>

        <select
          value={filterCam}
          onChange={e => setFilterCam(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All cameras</option>
          {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All vehicles</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="timestamp">Sort: Latest first</option>
          <option value="speed">Sort: Fastest first</option>
        </select>

        <div className="flex-1" />
        <span className="text-xs text-gray-500">{filtered.length} records</span>

        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
            <tr>
              {["Time", "Camera", "Vehicle", "Speed", "Limit", "Over By", "Plate", "Snapshot"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr
                key={v.id || i}
                className="border-b border-gray-800/60 hover:bg-gray-900/50 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-gray-400 whitespace-nowrap">
                  {(() => { try { return format(new Date(v.timestamp), "MMM d HH:mm:ss"); } catch { return v.timestamp; } })()}
                </td>
                <td className="px-4 py-2.5 text-gray-300">{camMap[v.camera_id] || v.camera_id}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded capitalize">{v.vehicle_class}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono font-bold text-red-400">{v.detected_speed.toFixed(0)} km/h</span>
                </td>
                <td className="px-4 py-2.5 font-mono text-gray-400">{v.speed_limit} km/h</td>
                <td className="px-4 py-2.5">
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${severityColor(v.overspeed_by)}`}>
                    +{v.overspeed_by.toFixed(0)}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-gray-400">{v.license_plate || "—"}</td>
                <td className="px-4 py-2.5">
                  {v.snapshot_url ? (
                    <a
                      href={v.snapshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <AlertTriangle size={32} className="mb-3" />
            <div className="text-sm">No violations match your filters</div>
          </div>
        )}
      </div>
    </div>
  );
}
