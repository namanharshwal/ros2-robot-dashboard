import { useRos } from '@/contexts/RosContext';
import { useState } from 'react';
import {
  Wifi,
  Settings,
  Gauge,
  RotateCw,
  Save,
  Upload,
  Download,
} from 'lucide-react';

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#8B949E' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E6EDF3' }}>
          {value.toFixed(step < 1 ? 3 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          appearance: 'none',
          background: '#21262D',
          borderRadius: 3,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

export default function Config() {
  const { connected, parameters, updateParameters, connect, disconnect } = useRos();
  const [rosUrl, setRosUrl] = useState('ws://localhost:9090');
  const [autoConnect, setAutoConnect] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(5);
  const [refreshRate, setRefreshRate] = useState(10);
  const [bufferSize, setBufferSize] = useState(1000);
  const [debugLogging, setDebugLogging] = useState(false);
  const [logLevel, setLogLevel] = useState('INFO');

  return (
    <div
      style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 12,
        height: 'calc(100vh - 48px)',
        overflow: 'auto',
      }}
    >
      {/* Connection Settings */}
      <div className="panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wifi size={16} color="#8B949E" />
          Connection Settings
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>ROS Bridge URL</div>
          <input
            value={rosUrl}
            onChange={e => setRosUrl(e.target.value)}
            style={{
              width: '100%',
              background: '#21262D',
              border: '1px solid #30363D',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              color: '#E6EDF3',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setAutoConnect(!autoConnect)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              border: 'none',
              background: autoConnect ? '#3FB950' : '#30363D',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#FFF',
                position: 'absolute',
                top: 2,
                left: autoConnect ? 18 : 2,
                transition: 'left 0.2s',
              }}
            />
          </button>
          <span style={{ fontSize: 12, color: '#E6EDF3' }}>Auto-connect on startup</span>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Reconnect Attempts</div>
          <input
            type="number"
            value={reconnectAttempts}
            onChange={e => setReconnectAttempts(parseInt(e.target.value) || 0)}
            min={0}
            max={20}
            style={{
              width: '100%',
              background: '#21262D',
              border: '1px solid #30363D',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              color: '#E6EDF3',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!connected ? (
            <button onClick={connect} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Wifi size={14} /> Connect
            </button>
          ) : (
            <button onClick={disconnect} className="btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Wifi size={14} /> Disconnect
            </button>
          )}
        </div>

        <div style={{ padding: 10, background: '#21262D', borderRadius: 6, border: '1px solid #30363D' }}>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Connection Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#3FB950' : '#F85149' }} />
            <span style={{ fontSize: 12, color: connected ? '#3FB950' : '#F85149' }}>
              {connected ? 'Connected to ' + rosUrl : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Robot Parameters */}
      <div className="panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gauge size={16} color="#8B949E" />
          Robot Parameters
        </div>

        <Slider
          label="Max Linear Velocity"
          value={parameters.maxLinearVelocity}
          min={0}
          max={2.0}
          step={0.1}
          unit="m/s"
          onChange={v => updateParameters({ maxLinearVelocity: v })}
        />

        <Slider
          label="Max Angular Velocity"
          value={parameters.maxAngularVelocity}
          min={0}
          max={3.0}
          step={0.1}
          unit="rad/s"
          onChange={v => updateParameters({ maxAngularVelocity: v })}
        />

        <Slider
          label="Wheel Separation"
          value={parameters.wheelSeparation}
          min={0.3}
          max={1.0}
          step={0.01}
          unit="m"
          onChange={v => updateParameters({ wheelSeparation: v })}
        />

        <Slider
          label="Wheel Radius"
          value={parameters.wheelRadius}
          min={0.05}
          max={0.3}
          step={0.005}
          unit="m"
          onChange={v => updateParameters({ wheelRadius: v })}
        />

        <div>
          <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Encoder Resolution</div>
          <input
            type="number"
            value={parameters.encoderResolution}
            onChange={e => updateParameters({ encoderResolution: parseInt(e.target.value) || 4096 })}
            min={256}
            max={65536}
            step={256}
            style={{
              width: '100%',
              background: '#21262D',
              border: '1px solid #30363D',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              color: '#E6EDF3',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: 10, color: '#484F58', marginTop: 2 }}>ticks per revolution</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={14} /> Save Profile
          </button>
          <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#21262D', color: '#8B949E', border: '1px solid #30363D' }}>
            <Upload size={14} /> Load
          </button>
        </div>
      </div>

      {/* Interface Preferences + Advanced */}
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Interface Preferences */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} color="#8B949E" />
            Interface Preferences
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                border: 'none',
                background: '#30363D',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#FFF',
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span style={{ fontSize: 12, color: '#8B949E' }}>Dark Mode (always on)</span>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Telemetry Refresh Rate</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[10, 20, 50].map(hz => (
                <button
                  key={hz}
                  onClick={() => setRefreshRate(hz)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: refreshRate === hz ? '#388BFD' : '#21262D',
                    color: refreshRate === hz ? '#FFF' : '#8B949E',
                  }}
                >
                  {hz} Hz
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                border: 'none',
                background: '#30363D',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#FFF',
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span style={{ fontSize: 12, color: '#8B949E' }}>Sound Effects</span>
          </div>
        </div>

        {/* Advanced */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCw size={16} color="#8B949E" />
            Advanced
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Topic Refresh Rate</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 5, 10].map(hz => (
                <button
                  key={hz}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: '#21262D',
                    color: '#8B949E',
                  }}
                >
                  {hz} Hz
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Message Buffer Size</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[100, 500, 1000, 5000].map(size => (
                <button
                  key={size}
                  onClick={() => setBufferSize(size)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: bufferSize === size ? '#388BFD' : '#21262D',
                    color: bufferSize === size ? '#FFF' : '#8B949E',
                  }}
                >
                  {size >= 1000 ? `${size / 1000}k` : size}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setDebugLogging(!debugLogging)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                border: 'none',
                background: debugLogging ? '#3FB950' : '#30363D',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#FFF',
                  position: 'absolute',
                  top: 2,
                  left: debugLogging ? 18 : 2,
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span style={{ fontSize: 12, color: '#E6EDF3' }}>Debug Logging</span>
          </div>

          {debugLogging && (
            <div>
              <div style={{ fontSize: 11, color: '#484F58', marginBottom: 4 }}>Log Level</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['DEBUG', 'INFO', 'WARN', 'ERROR'].map(level => (
                  <button
                    key={level}
                    onClick={() => setLogLevel(level)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: logLevel === level ? '#388BFD' : '#21262D',
                      color: logLevel === level ? '#FFF' : '#8B949E',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Robot Image */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <img
            src="/robot-hero.jpg"
            alt="GT100 Robot"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </div>

      {/* Top view diagram */}
      <div className="panel" style={{ gridColumn: 'span 6', padding: 0, overflow: 'hidden' }}>
        <img
          src="/robot-top-view.jpg"
          alt="GT100 Top View"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* System Info */}
      <div className="panel" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3' }}>
          System Information
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Robot Model', 'GT100-Diff'],
            ['Drive Type', 'Differential Drive'],
            ['Main Wheels', '2x Powered (BLDC Hub Motors)'],
            ['Caster Wheels', '4x Passive (Ball Casters)'],
            ['Wheel Diameter', '150 mm'],
            ['Wheelbase', '400 mm'],
            ['Max Speed', '1.5 m/s'],
            ['Max Turning Speed', '90 deg/s'],
            ['Payload Capacity', '100 kg'],
            ['Battery', 'Li-Ion 24V / 10Ah'],
            ['Run Time', '6-8 hours'],
            ['Sensors', '2D LiDAR, IMU, Depth Camera'],
            ['Computing', 'NVIDIA Jetson / x86 PC'],
            ['Connectivity', 'Wi-Fi 2.4/5 GHz, Bluetooth'],
            ['ROS2 Distro', 'Humble Hawksbill'],
            ['Navigation', 'Nav2 + SLAM Toolbox'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: '#484F58' }}>{label}</div>
              <div style={{ fontSize: 12, color: '#E6EDF3' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
