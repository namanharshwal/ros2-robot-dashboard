import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  VelocityCommand,
  OdometryData,
  BatteryState,
  SensorStatus,
  JointState,
  LogEntry,
  TopicInfo,
  NavigationGoal,
  TfFrame,
  RobotParameters,
} from '@/types/ros';

interface RosContextType {
  connected: boolean;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
  velocity: VelocityCommand;
  odometry: OdometryData;
  battery: BatteryState;
  sensors: SensorStatus[];
  jointState: JointState;
  logs: LogEntry[];
  topics: TopicInfo[];
  goals: NavigationGoal[];
  tfFrames: TfFrame[];
  slamActive: boolean;
  navigationActive: boolean;
  parameters: RobotParameters;
  publishVelocity: (vel: VelocityCommand) => void;
  emergencyStop: () => void;
  resetOdometry: () => void;
  startSlam: () => void;
  stopSlam: () => void;
  saveMap: (name: string) => void;
  addGoal: (x: number, y: number, yaw: number) => void;
  removeGoal: (id: string) => void;
  clearGoals: () => void;
  updateParameters: (params: Partial<RobotParameters>) => void;
}

const defaultVelocity: VelocityCommand = {
  linear: { x: 0, y: 0, z: 0 },
  angular: { x: 0, y: 0, z: 0 },
};

const defaultOdometry: OdometryData = {
  position: { x: 0, y: 0, z: 0 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  linearVelocity: { x: 0, y: 0, z: 0 },
  angularVelocity: { x: 0, y: 0, z: 0 },
};

const defaultBattery: BatteryState = {
  voltage: 23.8,
  current: -1.2,
  percentage: 78,
  present: true,
};

const defaultSensors: SensorStatus[] = [
  { name: '2D LiDAR', type: 'sensor_msgs/LaserScan', active: true, hz: 10, lastData: '14:32:05' },
  { name: 'IMU', type: 'sensor_msgs/Imu', active: true, hz: 50, lastData: '14:32:05' },
  { name: 'Depth Camera', type: 'sensor_msgs/Image', active: true, hz: 30, lastData: '14:32:04' },
  { name: 'Wheel Encoders', type: 'sensor_msgs/JointState', active: true, hz: 100, lastData: '14:32:05' },
];

const defaultJointState: JointState = {
  name: ['left_wheel_joint', 'right_wheel_joint'],
  position: [0, 0],
  velocity: [0, 0],
  effort: [0, 0],
};

const defaultTopics: TopicInfo[] = [
  { name: '/cmd_vel', type: 'geometry_msgs/Twist', hz: 10, bandwidth: 0.5, active: true, favorite: true },
  { name: '/odom', type: 'nav_msgs/Odometry', hz: 30, bandwidth: 3.2, active: true, favorite: true },
  { name: '/scan', type: 'sensor_msgs/LaserScan', hz: 10, bandwidth: 45.1, active: true, favorite: false },
  { name: '/tf', type: 'tf2_msgs/TFMessage', hz: 100, bandwidth: 12.8, active: true, favorite: false },
  { name: '/tf_static', type: 'tf2_msgs/TFMessage', hz: 0, bandwidth: 0, active: false, favorite: false },
  { name: '/map', type: 'nav_msgs/OccupancyGrid', hz: 0.1, bandwidth: 156.2, active: true, favorite: false },
  { name: '/amcl_pose', type: 'geometry_msgs/PoseWithCovarianceStamped', hz: 20, bandwidth: 2.1, active: true, favorite: false },
  { name: '/battery', type: 'sensor_msgs/BatteryState', hz: 1, bandwidth: 0.1, active: true, favorite: false },
  { name: '/joint_states', type: 'sensor_msgs/JointState', hz: 50, bandwidth: 4.5, active: true, favorite: false },
  { name: '/imu', type: 'sensor_msgs/Imu', hz: 100, bandwidth: 18.3, active: true, favorite: false },
  { name: '/camera/image_raw', type: 'sensor_msgs/Image', hz: 30, bandwidth: 221.4, active: true, favorite: false },
  { name: '/camera/depth', type: 'sensor_msgs/Image', hz: 30, bandwidth: 442.8, active: true, favorite: false },
  { name: '/move_base/status', type: 'actionlib_msgs/GoalStatusArray', hz: 5, bandwidth: 0.8, active: false, favorite: false },
  { name: '/move_base_simple/goal', type: 'geometry_msgs/PoseStamped', hz: 0, bandwidth: 0, active: false, favorite: false },
  { name: '/emergency_stop', type: 'std_msgs/Bool', hz: 0, bandwidth: 0, active: false, favorite: false },
  { name: '/diagnostics', type: 'diagnostic_msgs/DiagnosticArray', hz: 1, bandwidth: 2.3, active: true, favorite: false },
  { name: '/rosout', type: 'rosgraph_msgs/Log', hz: 2, bandwidth: 1.5, active: true, favorite: false },
  { name: '/clock', type: 'rosgraph_msgs/Clock', hz: 1000, bandwidth: 8.0, active: true, favorite: false },
];

const defaultParameters: RobotParameters = {
  maxLinearVelocity: 1.5,
  maxAngularVelocity: 2.0,
  wheelSeparation: 0.4,
  wheelRadius: 0.075,
  encoderResolution: 4096,
};

const RosContext = createContext<RosContextType | null>(null);

export function useRos() {
  const ctx = useContext(RosContext);
  if (!ctx) throw new Error('useRos must be used within RosProvider');
  return ctx;
}

// Demo data generator for simulation mode
function useDemoData(
  connected: boolean,
  velocity: VelocityCommand,
  setOdometry: React.Dispatch<React.SetStateAction<OdometryData>>,
  setBattery: React.Dispatch<React.SetStateAction<BatteryState>>,
  setSensors: React.Dispatch<React.SetStateAction<SensorStatus[]>>,
  setJointState: React.Dispatch<React.SetStateAction<JointState>>,
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  setTopics: React.Dispatch<React.SetStateAction<TopicInfo[]>>,
  setTfFrames: React.Dispatch<React.SetStateAction<TfFrame[]>>,
  logsRef: React.MutableRefObject<LogEntry[]>,
  positionRef: React.RefObject<{ x: number; y: number; yaw: number }>,
  slamActive: boolean,
  goals: NavigationGoal[],
  setGoals: React.Dispatch<React.SetStateAction<NavigationGoal[]>>,
  navigationActive: boolean,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const dt = 0.1;

      // Update odometry from velocity
      positionRef.current.yaw += velocity.angular.z * dt;
      positionRef.current.x += velocity.linear.x * Math.cos(positionRef.current.yaw) * dt;
      positionRef.current.y += velocity.linear.x * Math.sin(positionRef.current.yaw) * dt;

      setOdometry(prev => ({
        position: {
          x: positionRef.current.x,
          y: positionRef.current.y,
          z: 0,
        },
        orientation: {
          x: 0,
          y: 0,
          z: Math.sin(positionRef.current.yaw / 2),
          w: Math.cos(positionRef.current.yaw / 2),
        },
        linearVelocity: { ...velocity.linear },
        angularVelocity: { ...velocity.angular },
      }));

      // Update joint states from velocity
      const leftRpm = (velocity.linear.x - velocity.angular.z * 0.2) * 60 / (2 * Math.PI * 0.075);
      const rightRpm = (velocity.linear.x + velocity.angular.z * 0.2) * 60 / (2 * Math.PI * 0.075);
      setJointState(prev => ({
        ...prev,
        position: [prev.position[0] + leftRpm * dt * 0.1, prev.position[1] + rightRpm * dt * 0.1],
        velocity: [leftRpm, rightRpm],
      }));

      // Update battery (slow drain)
      setBattery(prev => {
        const drain = velocity.linear.x !== 0 || velocity.angular.z !== 0 ? 0.001 : 0.0001;
        const newPct = Math.max(0, prev.percentage - drain);
        return {
          ...prev,
          percentage: newPct,
          voltage: 20 + (newPct / 100) * 4,
          current: velocity.linear.x !== 0 ? -1.5 - Math.abs(velocity.linear.x) : -0.5,
        };
      });

      // Update sensor Hz with small variation
      setSensors(prev => prev.map(s => ({
        ...s,
        hz: s.active ? s.hz * (0.95 + Math.random() * 0.1) : 0,
        lastData: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })));

      // Update topic Hz
      setTopics(prev => prev.map(t => ({
        ...t,
        hz: t.active ? t.hz * (0.9 + Math.random() * 0.2) : 0,
      })));

      // Update TF frames
      setTfFrames([
        { frame_id: 'map', child_frame_id: 'odom', translation: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        { frame_id: 'odom', child_frame_id: 'base_footprint', translation: { x: positionRef.current.x, y: positionRef.current.y, z: 0 }, rotation: { x: 0, y: 0, z: Math.sin(positionRef.current.yaw / 2), w: Math.cos(positionRef.current.yaw / 2) } },
        { frame_id: 'base_footprint', child_frame_id: 'base_link', translation: { x: 0, y: 0, z: 0.05 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        { frame_id: 'base_link', child_frame_id: 'laser_link', translation: { x: 0.1, y: 0, z: 0.15 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        { frame_id: 'base_link', child_frame_id: 'camera_link', translation: { x: 0.08, y: 0, z: 0.12 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        { frame_id: 'base_link', child_frame_id: 'left_wheel', translation: { x: 0, y: -0.2, z: -0.02 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        { frame_id: 'base_link', child_frame_id: 'right_wheel', translation: { x: 0, y: 0.2, z: -0.02 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      ]);

      // Navigation simulation
      if (navigationActive && goals.length > 0) {
        setGoals(prev => {
          const active = prev.find(g => g.status === 'active');
          if (active) {
            const dx = active.x - positionRef.current.x;
            const dy = active.y - positionRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.1) {
              return prev.map(g => g.id === active.id ? { ...g, status: 'completed' as const } : g);
            }
          } else {
            const pending = prev.find(g => g.status === 'pending');
            if (pending) {
              return prev.map(g => g.id === pending.id ? { ...g, status: 'active' as const } : g);
            }
          }
          return prev;
        });
      }

      // Add occasional log
      if (Math.random() < 0.02) {
        const levels: Array<'INFO' | 'WARN' | 'ERROR'> = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
        const messages = [
          'Odometry filter updated',
          'LiDAR scan received',
          'Joint state published',
          'AMCL pose updated',
          'Costmap updated',
          'Battery voltage stable',
          'Motor controller heartbeat',
          'TF transform published',
          'Camera frame captured',
          'Navigation goal reached',
        ];
        const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
          level: levels[Math.floor(Math.random() * levels.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          source: ['diff_drive_controller', 'amcl', 'move_base', 'sensor_driver'][Math.floor(Math.random() * 4)],
        };
        logsRef.current = [...logsRef.current.slice(-199), newLog];
        setLogs(logsRef.current);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connected, velocity, slamActive, navigationActive, goals.length]);
}

export function RosProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [velocity, setVelocity] = useState<VelocityCommand>(defaultVelocity);
  const [odometry, setOdometry] = useState<OdometryData>(defaultOdometry);
  const [battery, setBattery] = useState<BatteryState>(defaultBattery);
  const [sensors, setSensors] = useState<SensorStatus[]>(defaultSensors);
  const [jointState, setJointState] = useState<JointState>(defaultJointState);
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: '14:30:00.000', level: 'INFO', message: 'ROS2 WebSocket bridge initialized', source: 'rosbridge' },
    { timestamp: '14:30:01.234', level: 'INFO', message: 'Connected to ws://localhost:9090', source: 'rosbridge' },
    { timestamp: '14:30:02.100', level: 'INFO', message: 'diff_drive_controller loaded successfully', source: 'controller_manager' },
    { timestamp: '14:30:02.500', level: 'INFO', message: 'joint_state_broadcaster active', source: 'controller_manager' },
    { timestamp: '14:30:03.000', level: 'INFO', message: 'AMCL localization initialized', source: 'amcl' },
    { timestamp: '14:30:03.800', level: 'INFO', message: 'LiDAR driver started - 10 Hz', source: 'lidar_driver' },
    { timestamp: '14:30:04.200', level: 'INFO', message: 'IMU calibration complete', source: 'imu_driver' },
    { timestamp: '14:30:05.000', level: 'WARN', message: 'Camera exposure auto-adjusting', source: 'camera_driver' },
  ]);
  const [topics, setTopics] = useState<TopicInfo[]>(defaultTopics);
  const [goals, setGoals] = useState<NavigationGoal[]>([]);
  const [tfFrames, setTfFrames] = useState<TfFrame[]>([]);
  const [slamActive, setSlamActive] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const [parameters, setParameters] = useState<RobotParameters>(defaultParameters);

  const logsRef = useRef<LogEntry[]>(logs);
  const positionRef = useRef({ x: 0, y: 0, yaw: 0 });

  useDemoData(
    connected, velocity, setOdometry, setBattery, setSensors,
    setJointState, setLogs, setTopics, setTfFrames, logsRef,
    positionRef, slamActive, goals, setGoals, navigationActive
  );

  const connect = useCallback(() => {
    setConnecting(true);
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
        level: 'INFO',
        message: 'Connected to ROS2 WebSocket bridge',
        source: 'rosbridge',
      };
      logsRef.current = [...logsRef.current.slice(-199), newLog];
      setLogs(logsRef.current);
    }, 1500);
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setVelocity(defaultVelocity);
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      level: 'INFO',
      message: 'Disconnected from ROS2 WebSocket bridge',
      source: 'rosbridge',
    };
    logsRef.current = [...logsRef.current.slice(-199), newLog];
    setLogs(logsRef.current);
  }, []);

  const publishVelocity = useCallback((vel: VelocityCommand) => {
    setVelocity(vel);
  }, []);

  const emergencyStop = useCallback(() => {
    setVelocity(defaultVelocity);
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      level: 'ERROR',
      message: 'EMERGENCY STOP activated - all motors halted',
      source: 'safety',
    };
    logsRef.current = [...logsRef.current.slice(-199), newLog];
    setLogs(logsRef.current);
  }, []);

  const resetOdometry = useCallback(() => {
    positionRef.current = { x: 0, y: 0, yaw: 0 };
    setOdometry(defaultOdometry);
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      level: 'INFO',
      message: 'Odometry reset to origin',
      source: 'diff_drive_controller',
    };
    logsRef.current = [...logsRef.current.slice(-199), newLog];
    setLogs(logsRef.current);
  }, []);

  const startSlam = useCallback(() => {
    setSlamActive(true);
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      level: 'INFO',
      message: 'SLAM toolbox started - online_async mode',
      source: 'slam_toolbox',
    };
    logsRef.current = [...logsRef.current.slice(-199), newLog];
    setLogs(logsRef.current);
  }, []);

  const stopSlam = useCallback(() => {
    setSlamActive(false);
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      level: 'INFO',
      message: 'SLAM toolbox stopped',
      source: 'slam_toolbox',
    };
    logsRef.current = [...logsRef.current.slice(-199), newLog];
    setLogs(logsRef.current);
  }, []);

  const saveMap = useCallback((name: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      level: 'INFO',
      message: `Map saved to ${name}.pgm + ${name}.yaml`,
      source: 'map_server',
    };
    logsRef.current = [...logsRef.current.slice(-199), newLog];
    setLogs(logsRef.current);
  }, []);

  const addGoal = useCallback((x: number, y: number, yaw: number) => {
    const newGoal: NavigationGoal = {
      id: Date.now().toString(),
      x,
      y,
      yaw,
      status: 'pending',
    };
    setGoals(prev => [...prev, newGoal]);
    setNavigationActive(true);
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const clearGoals = useCallback(() => {
    setGoals([]);
    setNavigationActive(false);
  }, []);

  const updateParameters = useCallback((params: Partial<RobotParameters>) => {
    setParameters(prev => ({ ...prev, ...params }));
  }, []);

  return (
    <RosContext.Provider value={{
      connected,
      connecting,
      connect,
      disconnect,
      velocity,
      odometry,
      battery,
      sensors,
      jointState,
      logs,
      topics,
      goals,
      tfFrames,
      slamActive,
      navigationActive,
      parameters,
      publishVelocity,
      emergencyStop,
      resetOdometry,
      startSlam,
      stopSlam,
      saveMap,
      addGoal,
      removeGoal,
      clearGoals,
      updateParameters,
    }}>
      {children}
    </RosContext.Provider>
  );
}
