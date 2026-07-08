import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Violation } from "../types";

interface Props {
  alerts: Violation[];
  onDismiss: () => void;
}

export default function AlertBanner({ alerts, onDismiss }: Props) {
  const latest = alerts[0];
  if (!latest) return null;

  return (
    <div className="violation-flash bg-red-950 border-b-2 border-red-500 px-6 py-2.5 flex items-center gap-3 z-50 shrink-0">
      <AlertTriangle size={16} className="text-red-400 shrink-0 animate-pulse" />
      <div className="flex-1 text-sm">
        <span className="font-bold text-red-300">OVERSPEED VIOLATION</span>
        <span className="text-red-200 ml-2">
          Camera {latest.camera_id} — {latest.vehicle_class} detected at{" "}
          <span className="font-mono font-bold text-red-100">{latest.detected_speed.toFixed(0)} km/h</span>
          {" "}(limit: {latest.speed_limit} km/h, over by {latest.overspeed_by.toFixed(0)} km/h)
        </span>
        {alerts.length > 1 && (
          <span className="text-red-400 ml-2">+{alerts.length - 1} more</span>
        )}
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-200 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
