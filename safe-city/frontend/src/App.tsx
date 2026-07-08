import React, { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Shield, Activity, Map, AlertTriangle, Video, BarChart2, Settings, Wifi, WifiOff } from "lucide-react";
import { WsMessage, Violation, Camera as CameraType } from "./types";
import { useWebSocket } from "./hooks/useWebSocket";
import LiveMap from "./components/LiveMap";
import StreamMixer from "./components/StreamMixer";
import ViolationLog from "./components/ViolationLog";
import Analytics from "./components/Analytics";
import CameraGrid from "./components/CameraGrid";
import AlertBanner from "./components/AlertBanner";

type Tab = "dashboard" | "map" | "mixer" | "violations" | "analytics" | "settings";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Violation[]>([]);
  const [totalViolations, setTotalViolations] = useState(0);
  const alertTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "violation" && msg.data) {
      const v = msg.data;
      setViolations(prev => [v, ...prev].slice(0, 500));
      setRecentAlerts(prev => [v, ...prev].slice(0, 5));
      setTotalViolations(n => n + 1);
      clearTimeout(alertTimeout.current);
      alertTimeout.current = setTimeout(() => setRecentAlerts([]), 8000);
    }
  }, []);

  const { connected } = useWebSocket(handleWsMessage);

  useEffect(() => {
    fetch(`${API}/cameras`)
      .then(r => r.json())
      .then(setCameras)
      .catch(() => {});
    fetch(`${API}/violations?limit=100`)
      .then(r => r.json())
      .then((vs: Violation[]) => { setViolations(vs); setTotalViolations(vs.length); })
      .catch(() => {});
  }, []);

  const activeCameras = cameras.filter(c => c.stream_connected).length;

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Activity size={18} /> },
    { id: "map", label: "Live Map", icon: <Map size={18} /> },
    { id: "mixer", label: "Stream Mixer", icon: <Video size={18} /> },
    { id: "violations", label: "Violations", icon: <AlertTriangle size={18} />, badge: totalViolations },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-blue-400" />
            <div>
              <div className="text-sm font-bold text-white leading-tight">SafeCity</div>
              <div className="text-xs text-gray-500 leading-tight">Speed Detection</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative
                ${tab === item.id
                  ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge > 999 ? "999+" : item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-5 py-4 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            {connected
              ? <><Wifi size={12} className="text-green-400" /><span className="text-green-400">Live</span></>
              : <><WifiOff size={12} className="text-red-400" /><span className="text-red-400">Offline</span></>
            }
          </div>
          <div className="text-xs text-gray-500">
            <span className="text-gray-300">{activeCameras}</span>/{cameras.length} cameras active
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Alert banner */}
        {recentAlerts.length > 0 && (
          <AlertBanner alerts={recentAlerts} onDismiss={() => setRecentAlerts([])} />
        )}

        {/* Top bar */}
        <header className="h-12 shrink-0 bg-gray-900/80 border-b border-gray-800 px-6 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-white">
            {navItems.find(n => n.id === tab)?.label}
          </h1>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span><span className="text-white font-mono">{totalViolations}</span> violations today</span>
            <span className="text-gray-600">|</span>
            <span><span className="text-white font-mono">{cameras.length}</span> cameras</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {tab === "dashboard" && (
            <CameraGrid cameras={cameras} violations={violations} />
          )}
          {tab === "map" && (
            <LiveMap cameras={cameras} violations={violations} />
          )}
          {tab === "mixer" && (
            <StreamMixer cameras={cameras} />
          )}
          {tab === "violations" && (
            <ViolationLog violations={violations} cameras={cameras} />
          )}
          {tab === "analytics" && (
            <Analytics violations={violations} cameras={cameras} />
          )}
          {tab === "settings" && (
            <SettingsPage cameras={cameras} onRefresh={() => {
              fetch(`${API}/cameras`).then(r => r.json()).then(setCameras).catch(() => {});
            }} />
          )}
        </div>
      </main>
    </div>
  );
}

function SettingsPage({ cameras, onRefresh }: { cameras: CameraType[]; onRefresh: () => void }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const [form, setForm] = useState({ name: "", rtsp_url: "", location: "", speed_limit: 60, zone_type: "urban" });
  const [status, setStatus] = useState("");

  const add = async () => {
    setStatus("Adding...");
    try {
      const r = await fetch(`${API}/cameras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) { setStatus("Camera added"); onRefresh(); }
      else setStatus("Error adding camera");
    } catch { setStatus("Network error"); }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Camera Management</h2>

      <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-6">
        <h3 className="text-sm font-semibold mb-3 text-blue-400">Add New Camera</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Name", "name", "text"],
            ["RTSP URL", "rtsp_url", "text"],
            ["Location", "location", "text"],
            ["Speed Limit (km/h)", "speed_limit", "number"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="text-xs text-gray-400 block mb-1">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? +e.target.value : e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Zone Type</label>
            <select
              value={form.zone_type}
              onChange={e => setForm(f => ({ ...f, zone_type: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {["urban", "school", "highway", "residential"].map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={add}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Add Camera
          </button>
          {status && <span className="text-xs text-gray-400">{status}</span>}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <h3 className="text-sm font-semibold mb-3 text-blue-400">Registered Cameras</h3>
        <div className="space-y-2">
          {cameras.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-800">
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.location} — {c.speed_limit} km/h</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.stream_connected ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                {c.stream_connected ? "Live" : "Offline"}
              </span>
            </div>
          ))}
          {cameras.length === 0 && <p className="text-xs text-gray-500">No cameras registered</p>}
        </div>
      </div>
    </div>
  );
}
