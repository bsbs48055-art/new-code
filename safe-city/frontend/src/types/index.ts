export interface Camera {
  id: string;
  name: string;
  location: string;
  rtsp_url: string;
  latitude: number;
  longitude: number;
  zone_type: "urban" | "school" | "highway" | "residential";
  speed_limit: number;
  is_active: boolean;
  stream_connected: boolean;
  stream_fps: number;
}

export interface Violation {
  id: string;
  camera_id: string;
  track_id: number;
  vehicle_class: string;
  detected_speed: number;
  speed_limit: number;
  overspeed_by: number;
  snapshot_url?: string;
  license_plate?: string;
  confidence: number;
  timestamp: string;
  reviewed: boolean;
  challan_issued: boolean;
}

export interface SpeedLog {
  id: string;
  camera_id: string;
  track_id: number;
  vehicle_class: string;
  speed: number;
  timestamp: string;
}

export interface WsMessage {
  type: "violation" | "speed_update" | "camera_status" | "welcome";
  data?: Violation;
  camera_id?: string;
  speeds?: Record<number, number>;
  status?: string;
  message?: string;
  ts?: number;
}

export interface ViolationStats {
  total: number;
  by_camera: Record<string, number>;
  avg_overspeed: number;
}

export interface MixerStatus {
  cameras: number;
  pip_mode: string | null;
  cell_states: Record<string, {
    connected: boolean;
    fps: number;
    active_tracks: number;
    max_speed: number;
    violation_count: number;
    is_violation: boolean;
  }>;
}
