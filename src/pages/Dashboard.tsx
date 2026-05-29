import { useRos } from '@/contexts/RosContext';
import { useState, useMemo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Scan,
  Compass,
  Video,
  RotateCw,
  Wifi,
  WifiOff,
  Clock,
  Gauge,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const sensorIcons: Record<string, React.ReactNode> = {
  '2D LiDAR': <Scan size={20} color="#58A6FF" />,
  'IMU': <Compass size={20} color="#58A6FF" />,
  'Depth Camera': <Video size={20} color="#58A6FF" />,
  'Wheel Encoders': <RotateCw size={20} color="#58A6FF" />,
};

// Velocity gauge component
function VelocityGauge({ velocity }: { velocity: number }) {
  const maxVel = 1.5;
  const pct = Math.min(Math.abs(velocity) / maxVel * 100, 100);
  const data = [{ name: 'velocity', value: pct }];

  return (
    <div style={{ position: 'relative', width: 200, height: 160 }}>
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="80%"
          innerRadius="60%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            fill={velocity >= 0 ? '#388BFD' : '#F0883E'}
            background={{ fill: '#21262D' }}
            stroke="none"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-gauge)',
            fontSize: 32,
            fontWeight: 700,
            color: '#E6EDF3',
            lineHeight: 1,
          }}
        >
          {velocity.toFixed(2)}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#8B949E',
            fontFamily: 'var(--font-body)',
          }}
        >
          m/s
        </div>
      </div>
    </div>
  );
}

// Battery gauge component
function BatteryGauge({ percentage, voltage }: { percentage: number; voltage: number }) {
  const color = percentage > 60 ? '#3FB950' : percentage > 20 ? '#D29922' : '#F85149';
  const data = [{ name: 'battery', value: percentage }];

  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            fill={color}
            background={{ fill: '#21262D' }}
            stroke="none"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-gauge)',
            fontSize: 28,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {Math.round(percentage)}%
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#8B949E',
            fontFamily: 'var(--font-mono)',
            marginTop: 4,
          }}
        >
          {voltage.toFixed(1)}V
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#484F58',
            fontFamily: 'var(--font-body)',
            marginTop: 2,
          }}
        >
          24V / 10Ah
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { connected, connecting, odometry, battery, sensors, jointState, logs } = useRos();
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');

  // History buffer for odometry chart
  const [history, setHistory] = useState<Array<{ time: number; linear: number; angular: number }>>([]);
  const historyRef = useMemo(() => ({ count: 0 }), []);

  // Update history
  useMemo(() => {
    historyRef.count++;
    if (historyRef.count % 3 !== 0) return;
    const newPoint = {
      time: Date.now(),
      linear: odometry.linearVelocity.x,
      angular: odometry.angularVelocity.z,
    };
    setHistory(prev => [...prev.slice(-299), newPoint]);
  }, [odometry.linearVelocity.x, odometry.angularVelocity.z]);

  const filteredLogs = logs.filter(l => logFilter === 'ALL' || l.level === logFilter);

  return (
    <div
      style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'auto auto auto',
        gap: 12,
        height: 'calc(100vh - 48px)',
        overflow: 'auto',
      }}
    >
      {/* Velocity Gauge */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Gauge size={16} color="#8B949E" />
          Linear Velocity
        </div>
        <VelocityGauge velocity={odometry.linearVelocity.x} />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: '#8B949E',
            marginTop: 8,
          }}
        >
          Angular: {odometry.angularVelocity.z.toFixed(2)} rad/s
        </div>
      </div>

      {/* Battery Gauge */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Battery Status
        </div>
        <BatteryGauge percentage={battery.percentage} voltage={battery.voltage} />
        <div
          style={{
            fontSize: 12,
            color: '#8B949E',
            marginTop: 4,
          }}
        >
          ~{Math.round(battery.percentage / 100 * 6)}h remaining
        </div>
      </div>

      {/* Connection Status */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {connected ? <Wifi size={16} color="#3FB950" /> : <WifiOff size={16} color="#F85149" />}
          Connection
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>ROS Bridge</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B949E' }}>
            ws://localhost:9090
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? '#3FB950' : '#F85149',
                ...(connected ? { animation: 'pulse-green 2s ease-in-out infinite' } : {}),
              }}
            />
            <span style={{ fontSize: 12, color: '#E6EDF3' }}>
              {connected ? 'Online' : connecting ? 'Connecting...' : 'Offline'}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>Latency</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B949E' }}>
            {connected ? '~12 ms' : 'N/A'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>ROS2 Distro</div>
          <div style={{ fontSize: 12, color: '#E6EDF3' }}>Humble Hawksbill</div>
        </div>
      </div>

      {/* Odometry Info */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
          }}
        >
          Odometry
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>Position (m)</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B949E', display: 'flex', gap: 12 }}>
            <span>X: {odometry.position.x.toFixed(3)}</span>
            <span>Y: {odometry.position.y.toFixed(3)}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>Orientation</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B949E' }}>
            Yaw: {(() => {
              const q = odometry.orientation;
              const siny = 2 * (q.w * q.z + q.x * q.y);
              const cosy = 1 - 2 * (q.y * q.y + q.z * q.z);
              return (Math.atan2(siny, cosy) * 180 / Math.PI).toFixed(1);
            })()}deg
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>Linear Velocity</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B949E' }}>
            X: {odometry.linearVelocity.x.toFixed(3)} m/s
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 2 }}>Angular Velocity</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B949E' }}>
            Z: {odometry.angularVelocity.z.toFixed(3)} rad/s
          </div>
        </div>
      </div>

      {/* Odometry Plot */}
      <div className="panel" style={{ gridColumn: 'span 6', height: 280 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
            marginBottom: 12,
          }}
        >
          Velocity History
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2128" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={() => ''}
            />
            <YAxis domain={[-1.5, 1.5]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#161B22',
                border: '1px solid #30363D',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}
              labelFormatter={() => ''}
              formatter={(value: number) => [value.toFixed(3), '']}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-body)' }}
            />
            <Line
              type="monotone"
              dataKey="linear"
              name="Linear X"
              stroke="#388BFD"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="angular"
              name="Angular Z"
              stroke="#F0883E"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sensor Status Grid */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
            marginBottom: 4,
          }}
        >
          Sensor Status
        </div>
        {sensors.map(sensor => (
          <div key={sensor.name} className="sensor-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {sensorIcons[sensor.name]}
              <span style={{ fontSize: 13, fontWeight: 500, color: '#E6EDF3', flex: 1 }}>
                {sensor.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: sensor.active ? '#3FB950' : '#F85149',
                }}
              />
              <span style={{ fontSize: 11, color: sensor.active ? '#3FB950' : '#F85149' }}>
                {sensor.active ? 'Active' : 'Offline'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8B949E', marginLeft: 'auto' }}>
                {sensor.hz.toFixed(1)} Hz
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#484F58' }}>
              {sensor.type}
            </div>
          </div>
        ))}
      </div>

      {/* Motor RPM */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
          }}
        >
          Motor Status
        </div>

        {jointState.name.map((name, idx) => (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#8B949E' }}>
                {name.replace('_joint', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E6EDF3' }}>
                {jointState.velocity[idx]?.toFixed(1) || '0.0'} RPM
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: '#21262D',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(Math.abs(jointState.velocity[idx] || 0) / 100 * 100, 100)}%`,
                  background: idx === 0 ? '#388BFD' : '#F0883E',
                  borderRadius: 4,
                  transition: 'width 0.1s',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#484F58',
                marginTop: 2,
              }}
            >
              Position: {((jointState.position[idx] || 0) % (2 * Math.PI)).toFixed(2)} rad
            </div>
          </div>
        ))}
      </div>

      {/* Recent Logs */}
      <div className="panel" style={{ gridColumn: 'span 12', height: 240, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 14,
              color: '#E6EDF3',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Clock size={16} color="#8B949E" />
            System Logs
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map(level => (
              <button
                key={level}
                onClick={() => setLogFilter(level)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: logFilter === level ? '#388BFD' : '#21262D',
                  color: logFilter === level ? '#FFF' : '#8B949E',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <ScrollArea style={{ flex: 1 }}>
          <div>
            {filteredLogs.slice(-100).map((log, idx) => (
              <div key={idx} className="log-entry">
                <span className="log-time">{log.timestamp}</span>
                <span className={log.level === 'INFO' ? 'log-level-info' : log.level === 'WARN' ? 'log-level-warn' : 'log-level-error'}>
                  [{log.level}]
                </span>
                <span style={{ color: '#8B949E' }}>[{log.source}]</span>
                <span style={{ color: '#E6EDF3', marginLeft: 8 }}>{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
