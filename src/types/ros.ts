export interface RosConfig {
  url: string;
  autoConnect: boolean;
  reconnectAttempts: number;
}

export interface VelocityCommand {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

export interface OdometryData {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
  linearVelocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
}

export interface BatteryState {
  voltage: number;
  current: number;
  percentage: number;
  present: boolean;
}

export interface LaserScan {
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  range_min: number;
  range_max: number;
  ranges: number[];
  intensities: number[];
}

export interface SensorStatus {
  name: string;
  type: string;
  active: boolean;
  hz: number;
  lastData: string;
}

export interface JointState {
  name: string[];
  position: number[];
  velocity: number[];
  effort: number[];
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  source: string;
}

export interface TopicInfo {
  name: string;
  type: string;
  hz: number;
  bandwidth: number;
  active: boolean;
  favorite: boolean;
}

export interface MapMetaData {
  resolution: number;
  width: number;
  height: number;
  origin: { x: number; y: number; z: number };
}

export interface NavigationGoal {
  id: string;
  x: number;
  y: number;
  yaw: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface TfFrame {
  frame_id: string;
  child_frame_id: string;
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
}

export interface RobotParameters {
  maxLinearVelocity: number;
  maxAngularVelocity: number;
  wheelSeparation: number;
  wheelRadius: number;
  encoderResolution: number;
}
