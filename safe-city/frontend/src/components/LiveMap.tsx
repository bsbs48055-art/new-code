import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Camera as CameraType, Violation } from "../types";

// Fix default marker icons for webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function cameraIcon(hasViolation: boolean, isActive: boolean) {
  const color = hasViolation ? "#ef4444" : isActive ? "#22c55e" : "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 8px ${color}88;
      font-size:14px;
    ">📷</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface Props {
  cameras: CameraType[];
  violations: Violation[];
}

export default function LiveMap({ cameras, violations }: Props) {
  const violByCam = violations.reduce<Record<string, number>>((a, v) => {
    a[v.camera_id] = (a[v.camera_id] || 0) + 1;
    return a;
  }, {});

  const located = cameras.filter(c => c.latitude && c.longitude);
  const center: [number, number] = located.length > 0
    ? [
        located.reduce((s, c) => s + c.latitude, 0) / located.length,
        located.reduce((s, c) => s + c.longitude, 0) / located.length,
      ]
    : [31.5204, 74.3587];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        style={{ background: "#1e293b" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />
        {located.map(cam => {
          const vCount = violByCam[cam.id] || 0;
          const hasViol = vCount > 0;
          return (
            <React.Fragment key={cam.id}>
              {hasViol && (
                <Circle
                  center={[cam.latitude, cam.longitude]}
                  radius={80}
                  pathOptions={{ color: "#ef4444", fillColor: "#ef444440", fillOpacity: 0.3, weight: 1.5 }}
                />
              )}
              <Marker
                position={[cam.latitude, cam.longitude]}
                icon={cameraIcon(hasViol, cam.stream_connected)}
              >
                <Popup>
                  <div className="text-sm space-y-1 min-w-[180px]">
                    <div className="font-bold text-base">{cam.name}</div>
                    <div className="text-gray-400 text-xs">{cam.location}</div>
                    <hr className="border-gray-700 my-1" />
                    <div className="flex justify-between">
                      <span>Zone:</span>
                      <span className="font-medium capitalize">{cam.zone_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limit:</span>
                      <span className="font-mono font-bold">{cam.speed_limit} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={cam.stream_connected ? "text-green-400" : "text-gray-500"}>
                        {cam.stream_connected ? "🟢 Live" : "⚫ Offline"}
                      </span>
                    </div>
                    {vCount > 0 && (
                      <div className="flex justify-between text-red-400 font-medium">
                        <span>Violations:</span>
                        <span>{vCount}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 text-xs space-y-1.5 z-[1000]">
        <div className="font-semibold text-gray-300 mb-1">Legend</div>
        {[
          ["🟢", "Camera Active"],
          ["🔴", "Active Violation"],
          ["⚫", "Camera Offline"],
        ].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-2 text-gray-400">
            <span>{icon}</span><span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
