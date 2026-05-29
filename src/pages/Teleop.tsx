import { useRos } from '@/contexts/RosContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  MoveRight,
  MoveLeft,
  Square,
  Keyboard,
  Gamepad2,
} from 'lucide-react';

// Virtual joystick
function VirtualJoystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    draggingRef.current = true;
    setActive(true);
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current || !baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 30;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    setPos({ x: dx, y: dy });

    // Deadzone 15%
    const deadR = maxR * 0.15;
    if (dist < deadR) {
      onChange(0, 0);
    } else {
      const nx = dx / maxR;
      const ny = -dy / maxR; // Invert Y for forward=up
      onChange(nx, ny);
    }
  }, [onChange]);

  const handleEnd = useCallback(() => {
    draggingRef.current = false;
    setActive(false);
    setPos({ x: 0, y: 0 });
    onChange(0, 0);
  }, [onChange]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      ref={baseRef}
      onMouseDown={e => handleStart(e.clientX, e.clientY)}
      onTouchStart={e => {
        if (e.touches.length > 0) handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
      style={{
        width: 240,
        height: 240,
        borderRadius: '50%',
        background: '#21262D',
        border: '2px solid #30363D',
        position: 'relative',
        cursor: 'pointer',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Crosshair */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#30363D', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#30363D', transform: 'translateX(-50%)' }} />

      {/* Deadzone circle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '30%',
          height: '30%',
          borderRadius: '50%',
          border: '1px dashed #484F58',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Handle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: active ? '#388BFD' : '#30363D',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
          boxShadow: active ? '0 0 16px rgba(56, 139, 253, 0.5)' : 'none',
          transition: active ? 'none' : 'transform 0.15s ease-out, background 0.15s, box-shadow 0.15s',
          pointerEvents: 'none',
        }}
      >
        {active && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#FFF',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      {/* Direction labels */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#484F58' }}>FWD</div>
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#484F58' }}>REV</div>
      <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#484F58' }}>L</div>
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#484F58' }}>R</div>
    </div>
  );
}

// Velocity bars
function VelocityBars({ linear, angular }: { linear: number; angular: number }) {
  const maxLinear = 1.5;
  const maxAngular = 2.0;
  const lPct = Math.min(Math.abs(linear) / maxLinear * 100, 100);
  const aPct = Math.min(Math.abs(angular) / maxAngular * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8B949E', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUp size={14} /> Linear X
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#E6EDF3' }}>
            {linear.toFixed(3)} m/s
          </span>
        </div>
        <div style={{ height: 12, background: '#21262D', borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${lPct}%`,
              background: linear >= 0 ? '#388BFD' : '#F0883E',
              borderRadius: 6,
              transition: 'width 0.05s',
              marginLeft: linear < 0 ? 'auto' : 0,
              marginRight: linear >= 0 ? 'auto' : 0,
            }}
          />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8B949E', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCw size={14} /> Angular Z
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#E6EDF3' }}>
            {angular.toFixed(3)} rad/s
          </span>
        </div>
        <div style={{ height: 12, background: '#21262D', borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${aPct}%`,
              background: angular >= 0 ? '#F0883E' : '#58A6FF',
              borderRadius: 6,
              transition: 'width 0.05s',
              marginLeft: angular < 0 ? 'auto' : 0,
              marginRight: angular >= 0 ? 'auto' : 0,
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: '#0D1117',
          borderRadius: 6,
          padding: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: '#8B949E',
          border: '1px solid #30363D',
        }}
      >
        <div style={{ color: '#484F58', marginBottom: 4 }}>/cmd_vel topic</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`{\n  "linear": {\n    "x": ${linear.toFixed(3)},\n    "y": 0.0,\n    "z": 0.0\n  },\n  "angular": {\n    "x": 0.0,\n    "y": 0.0,\n    "z": ${angular.toFixed(3)}\n  }\n}`}
        </pre>
      </div>
    </div>
  );
}

// Keyboard key display
function KeyCap({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 6,
        background: active ? '#388BFD' : '#21262D',
        border: `1px solid ${active ? '#388BFD' : '#30363D'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        fontWeight: 600,
        color: active ? '#FFF' : '#8B949E',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </div>
  );
}

export default function Teleop() {
  const { connected, publishVelocity, emergencyStop, resetOdometry, odometry, velocity } = useRos();
  const [speedPreset, setSpeedPreset] = useState(0.5);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Keyboard control loop
  useEffect(() => {
    if (!keyboardEnabled || !connected) return;

    const update = () => {
      const keys = keysRef.current;
      let linear = 0;
      let angular = 0;
      const boost = keys.has('Shift') ? 2 : 1;

      if (keys.has('w') || keys.has('arrowup')) linear += 1.5 * speedPreset * boost;
      if (keys.has('s') || keys.has('arrowdown')) linear -= 1.5 * speedPreset * boost;
      if (keys.has('a') || keys.has('arrowleft')) angular += 2.0 * speedPreset * boost;
      if (keys.has('d') || keys.has('arrowright')) angular -= 2.0 * speedPreset * boost;

      publishVelocity({
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [keyboardEnabled, connected, speedPreset, publishVelocity]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!keyboardEnabled) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
        setActiveKeys(new Set(keysRef.current));
      }
      if (k === ' ') {
        emergencyStop();
        keysRef.current.clear();
        setActiveKeys(new Set());
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current.delete(k);
      setActiveKeys(new Set(keysRef.current));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [keyboardEnabled, emergencyStop]);

  const handleJoystick = useCallback((jx: number, jy: number) => {
    if (!connected) return;
    publishVelocity({
      linear: { x: jy * 1.5, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: -jx * 2.0 },
    });
  }, [connected, publishVelocity]);

  const executeAction = useCallback((linear: number, angular: number) => {
    if (!connected) return;
    publishVelocity({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular },
    });
    setTimeout(() => {
      publishVelocity({
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 },
      });
    }, 1000);
  }, [connected, publishVelocity]);

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
      {/* Joystick */}
      <div className="panel" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
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
          <Gamepad2 size={16} color="#8B949E" />
          Virtual Joystick
        </div>
        <VirtualJoystick onChange={handleJoystick} />
        <div style={{ fontSize: 11, color: '#484F58', textAlign: 'center' }}>
          Click and drag to control
          <br />
          Release to stop
        </div>
      </div>

      {/* Control Mode Panel */}
      <div className="panel" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <Keyboard size={16} color="#8B949E" />
          Keyboard Control
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setKeyboardEnabled(!keyboardEnabled)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              border: 'none',
              background: keyboardEnabled ? '#3FB950' : '#30363D',
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
                left: keyboardEnabled ? 18 : 2,
                transition: 'left 0.2s',
              }}
            />
          </button>
          <span style={{ fontSize: 12, color: keyboardEnabled ? '#3FB950' : '#484F58' }}>
            {keyboardEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Key Map */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <KeyCap label="W" active={activeKeys.has('w') || activeKeys.has('arrowup')} />
          <div style={{ display: 'flex', gap: 4 }}>
            <KeyCap label="A" active={activeKeys.has('a') || activeKeys.has('arrowleft')} />
            <KeyCap label="S" active={activeKeys.has('s') || activeKeys.has('arrowdown')} />
            <KeyCap label="D" active={activeKeys.has('d') || activeKeys.has('arrowright')} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#8B949E', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyCap label="Space" active={false} />
            <span>Emergency Stop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyCap label="Shift" active={activeKeys.has('shift')} />
            <span>Speed Boost (2x)</span>
          </div>
        </div>

        {/* Speed Presets */}
        <div>
          <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 8 }}>Speed Preset</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0.25, 0.5, 0.75, 1.0].map(preset => (
              <button
                key={preset}
                onClick={() => setSpeedPreset(preset)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: speedPreset === preset ? '#388BFD' : '#21262D',
                  color: speedPreset === preset ? '#FFF' : '#8B949E',
                  transition: 'all 0.15s',
                }}
              >
                {preset * 100}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Velocity Preview */}
      <div className="panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
          }}
        >
          Velocity Output
        </div>
        <VelocityBars linear={velocity.linear.x} angular={velocity.angular.z} />
      </div>

      {/* Quick Actions */}
      <div className="panel" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
          }}
        >
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => executeAction(0, 1.57)}
            style={{
              padding: '12px',
              borderRadius: 6,
              border: '1px solid #388BFD',
              background: 'transparent',
              color: '#388BFD',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={16} /> Rotate Left 90
          </button>
          <button
            onClick={() => executeAction(0, -1.57)}
            style={{
              padding: '12px',
              borderRadius: 6,
              border: '1px solid #388BFD',
              background: 'transparent',
              color: '#388BFD',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCw size={16} /> Rotate Right 90
          </button>
          <button
            onClick={() => executeAction(0.5, 0)}
            style={{
              padding: '12px',
              borderRadius: 6,
              border: '1px solid #3FB950',
              background: 'transparent',
              color: '#3FB950',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <MoveRight size={16} /> Forward 1m
          </button>
          <button
            onClick={() => executeAction(-0.5, 0)}
            style={{
              padding: '12px',
              borderRadius: 6,
              border: '1px solid #3FB950',
              background: 'transparent',
              color: '#3FB950',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <MoveLeft size={16} /> Backward 1m
          </button>
        </div>

        <button
          onClick={emergencyStop}
          style={{
            padding: '14px',
            borderRadius: 6,
            border: 'none',
            background: '#F85149',
            color: '#FFF',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Square size={16} /> STOP ALL MOTORS
        </button>

        <button
          onClick={resetOdometry}
          style={{
            padding: '10px',
            borderRadius: 6,
            border: '1px solid #30363D',
            background: '#21262D',
            color: '#8B949E',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Reset Odometry
        </button>
      </div>

      {/* Robot Info Card */}
      <div className="panel" style={{ gridColumn: 'span 6' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 14,
            color: '#E6EDF3',
            marginBottom: 12,
          }}
        >
          Robot Info
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#484F58' }}>Model</div>
            <div style={{ fontSize: 13, color: '#E6EDF3' }}>GT100-Diff</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#484F58' }}>Drive Type</div>
            <div style={{ fontSize: 13, color: '#E6EDF3' }}>Differential Drive</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#484F58' }}>Main Wheels</div>
            <div style={{ fontSize: 13, color: '#E6EDF3' }}>2 (Powered)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#484F58' }}>Caster Wheels</div>
            <div style={{ fontSize: 13, color: '#E6EDF3' }}>4 (Passive)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#484F58' }}>Max Speed</div>
            <div style={{ fontSize: 13, color: '#E6EDF3' }}>1.5 m/s</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#484F58' }}>Wheelbase</div>
            <div style={{ fontSize: 13, color: '#E6EDF3' }}>0.4 m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
