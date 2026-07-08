import React, { useState } from "react";
import { Camera as CameraType, Violation } from "../types";
import { Wifi, WifiOff, AlertTriangle, Eye } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface Props {
  cameras: CameraType[];
  violations: Violation[];
}

function zoneColor(zone: string) {
  switch (zone) {
    case "school": return "text-yellow-400 bg-yellow-900/40";
    case "highway": return "text-purple-400 bg-purple-900/40";
    case "residential": return "text-green-400 bg-green-900/40";
    default: return "text-blue-400 bg-blue-900/40";
  }
}

function speedColor(speed: number, limit: number) {
  const ratio = speed / limit;
  if (ratio > 1.3) return "text-red-400";
  if (ratio > 1.0) return "text-orange-400";
  return "text-green-400";
}

export default function CameraGrid({ cameras, violations }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const recentViolationsPerCam = violations.reduce<Record<string, number>>((acc, v) => {
    acc[v.camera_id] = (acc[v.camera_id] || 0) + 1;
    return acc;
  }, {});

  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-3">📷</div>
          <div className="text-lg font-medium">No cameras registered</div>
          <div className="text-sm mt-1">Go to Settings to add cameras</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Cameras", value: cameras.length, color: "text-blue-400" },
          { label: "Active", value: cameras.filter(c => c.stream_connected).length, color: "text-green-400" },
          { label: "Violations Today", value: violations.length, color: "text-red-400" },
          { label: "Avg Speed Limit", value: Math.round(cameras.reduce((a,c) => a + c.speed_limit, 0) / Math.max(1, cameras.length)) + " km/h", color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Camera cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map(cam => {
          const violCount = recentViolationsPerCam[cam.id] || 0;
          const hasViolation = violCount > 0;

          return (
            <div
              key={cam.id}
              onClick={() => setSelected(selected === cam.id ? null : cam.id)}
              className={`bg-gray-900 rounded-xl border cursor-pointer transition-all hover:border-blue-600
                ${hasViolation ? "border-red-600/60" : "border-gray-800"}`}
            >
              {/* Live feed thumbnail */}
              <div className="relative bg-gray-950 rounded-t-xl overflow-hidden" style={{ height: 180 }}>
                <img
                  src={`${API}/cameras/${cam.id}/stream.mjpeg`}
                  alt={cam.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Overlays */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {cam.stream_connected
                    ? <span className="flex items-center gap-1 bg-green-900/80 text-green-300 text-xs px-2 py-0.5 rounded-full"><Wifi size={10} /> LIVE</span>
                    : <span className="flex items-center gap-1 bg-gray-800/80 text-gray-400 text-xs px-2 py-0.5 rounded-full"><WifiOff size={10} /> OFFLINE</span>
                  }
                </div>
                {hasViolation && (
                  <div className="absolute top-2 right-2 bg-red-600/90 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={10} /> {violCount}
                  </div>
                )}
                {cam.stream_fps > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-black/60 px-1.5 py-0.5 rounded font-mono">
                    {cam.stream_fps} FPS
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-semibold text-sm text-white">{cam.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[180px]">{cam.location}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${zoneColor(cam.zone_type)}`}>
                    {cam.zone_type}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-gray-400">Speed limit</span>
                  <span className="font-mono font-semibold text-white">{cam.speed_limit} km/h</span>
                </div>
                {violCount > 0 && (
                  <div className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle size={11} /> {violCount} violation{violCount > 1 ? "s" : ""} recorded
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
