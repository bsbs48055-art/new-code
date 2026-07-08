/**
 * StreamMixer — the "mixing thing"
 * Displays the backend-composed multi-camera mosaic with controls:
 *   • Grid mode vs PiP mode
 *   • Select focus camera for PiP
 *   • Live stats per cell
 *   • Violation overlay legend
 *   • Heatmap toggle
 */
import React, { useState, useEffect, useRef } from "react";
import { Grid, Maximize2, RefreshCw, Play, Pause, Info } from "lucide-react";
import { Camera as CameraType } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface MixerCellState {
  connected: boolean;
  fps: number;
  active_tracks: number;
  max_speed: number;
  violation_count: number;
  is_violation: boolean;
}

interface MixerStatus {
  cameras: number;
  pip_mode: string | null;
  cell_states: Record<string, MixerCellState>;
}

interface Props {
  cameras: CameraType[];
}

export default function StreamMixer({ cameras }: Props) {
  const [pipCamera, setPipCamera] = useState<string | null>(null);
  const [status, setStatus] = useState<MixerStatus | null>(null);
  const [paused, setPaused] = useState(false);
  const [streamKey, setStreamKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchStatus = () => {
    fetch(`${API}/mixer/status`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => clearInterval(pollRef.current);
  }, []);

  const setPip = async (cameraId: string | null) => {
    await fetch(`${API}/mixer/pip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camera_id: cameraId }),
    }).catch(() => {});
    setPipCamera(cameraId);
    fetchStatus();
  };

  const reload = () => setStreamKey(k => k + 1);

  const mixerSrc = `${API}/mixer/stream.mjpeg?t=${streamKey}`;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main mixer canvas */}
      <div className="flex-1 flex flex-col bg-gray-950">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-sm">
            <Grid size={15} />
            <span>Stream Mixer</span>
          </div>
          <div className="w-px h-5 bg-gray-700" />

          {/* Mode toggle */}
          <button
            onClick={() => setPip(null)}
            className={`text-xs px-3 py-1 rounded transition-colors ${pipCamera === null ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          >
            Grid
          </button>
          <span className="text-gray-600 text-xs">PiP Focus:</span>
          <select
            value={pipCamera || ""}
            onChange={e => setPip(e.target.value || null)}
            className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="">— none —</option>
            {cameras.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex-1" />

          {/* Controls */}
          <button
            onClick={() => { setPaused(p => !p); if (paused && imgRef.current) imgRef.current.src = mixerSrc; }}
            className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={reload}
            className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
          >
            <RefreshCw size={12} /> Reload
          </button>

          {status && (
            <span className="text-xs text-gray-500">
              {status.cameras} feeds
            </span>
          )}
        </div>

        {/* MJPEG stream */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-950 p-3">
          {!paused ? (
            <img
              ref={imgRef}
              key={streamKey}
              src={mixerSrc}
              alt="Mixed stream"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-gray-800"
              onError={() => {}}
            />
          ) : (
            <div className="text-gray-600 text-center">
              <Pause size={40} className="mx-auto mb-2" />
              <div className="text-sm">Stream paused</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="shrink-0 px-4 py-2 bg-gray-900/50 border-t border-gray-800 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-green-500 inline-block" /> Normal</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-red-500 inline-block animate-pulse" /> Violation</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-900 inline-block" /> Speed heatmap overlay</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Live indicator dot</div>
        </div>
      </div>

      {/* Right panel: per-camera stats */}
      <div className="w-56 shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto">
        <div className="px-3 py-3 border-b border-gray-800 text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <Info size={12} /> Cell Status
        </div>
        {status && Object.entries(status.cell_states).map(([cid, cell]) => {
          const cam = cameras.find(c => c.id === cid);
          return (
            <div
              key={cid}
              className={`px-3 py-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors
                ${cell.is_violation ? "bg-red-950/30" : ""}`}
              onClick={() => setPip(pipCamera === cid ? null : cid)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white truncate max-w-[110px]">
                  {cam?.name || cid}
                </span>
                <span className={`w-2 h-2 rounded-full ${cell.connected ? "bg-green-400" : "bg-gray-600"}`} />
              </div>
              <div className="space-y-0.5 text-xs font-mono text-gray-400">
                <div className="flex justify-between">
                  <span>FPS</span><span className="text-gray-300">{cell.fps}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicles</span><span className="text-gray-300">{cell.active_tracks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max spd</span>
                  <span className={cell.max_speed > (cam?.speed_limit || 60) ? "text-red-400 font-bold" : "text-gray-300"}>
                    {cell.max_speed} km/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Violations</span>
                  <span className={cell.violation_count > 0 ? "text-red-400" : "text-gray-500"}>
                    {cell.violation_count}
                  </span>
                </div>
              </div>
              {pipCamera === cid && (
                <div className="mt-1.5 text-xs text-blue-400 font-medium">▶ PiP Focus</div>
              )}
            </div>
          );
        })}
        {(!status || Object.keys(status.cell_states).length === 0) && (
          <div className="px-3 py-6 text-xs text-gray-600 text-center">
            Waiting for camera data…
          </div>
        )}
      </div>
    </div>
  );
}
