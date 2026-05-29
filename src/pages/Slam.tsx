import { useRos } from '@/contexts/RosContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  Save,
  MapPin,
  Target,
  Trash2,
  Navigation,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

// Simulated map canvas
function MapCanvas({
  robotX,
  robotY,
  robotYaw,
  goals,
  zoom,
  onSetGoal,
}: {
  robotX: number;
  robotY: number;
  robotYaw: number;
  goals: Array<{ id: string; x: number; y: number; status: string }>;
  zoom: number;
  onSetGoal: (x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Generate map obstacles (simulated)
  const mapData = useRef<Array<{ x: number; y: number; w: number; h: number }>>([
    { x: -2, y: -2, w: 0.3, h: 2 },
    { x: 1.5, y: -1, w: 0.2, h: 1.5 },
    { x: -1, y: 1.5, w: 1.5, h: 0.2 },
    { x: 0.5, y: 0.5, w: 0.3, h: 0.3 },
    { x: -3, y: 0, w: 0.2, h: 0.8 },
    { x: 2.5, y: -2.5, w: 0.4, h: 0.4 },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = 60 * zoom;
    const cx = w / 2 + pan.x;
    const cy = h / 2 + pan.y;

    // Clear
    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1C2128';
    ctx.lineWidth = 1;
    const gridSize = 1; // 1 meter
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * gridSize * scale, 0);
      ctx.lineTo(cx + i * gridSize * scale, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cy + i * gridSize * scale);
      ctx.lineTo(w, cy + i * gridSize * scale);
      ctx.stroke();
    }

    // Axis lines
    ctx.strokeStyle = '#30363D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Obstacles (simulated)
    ctx.fillStyle = '#484F58';
    for (const obs of mapData.current) {
      ctx.fillRect(
        cx + obs.x * scale,
        cy - (obs.y + obs.h) * scale,
        obs.w * scale,
        obs.h * scale
      );
    }

    // Goal markers
    for (const goal of goals) {
      const gx = cx + goal.x * scale;
      const gy = cy - goal.y * scale;

      // Circle
      ctx.strokeStyle = goal.status === 'completed' ? '#3FB950' : goal.status === 'active' ? '#388BFD' : '#58A6FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy, 10, 0, Math.PI * 2);
      ctx.stroke();

      // X
      ctx.beginPath();
      ctx.moveTo(gx - 6, gy - 6);
      ctx.lineTo(gx + 6, gy + 6);
      ctx.moveTo(gx + 6, gy - 6);
      ctx.lineTo(gx - 6, gy + 6);
      ctx.stroke();

      // Status dot
      ctx.fillStyle = goal.status === 'completed' ? '#3FB950' : goal.status === 'active' ? '#388BFD' : '#484F58';
      ctx.beginPath();
      ctx.arc(gx, gy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // LiDAR scan rays (simulated)
    const rx = cx + robotX * scale;
    const ry = cy - robotY * scale;
    ctx.strokeStyle = 'rgba(63, 185, 80, 0.15)';
    ctx.lineWidth = 0.5;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      const rayLen = 2 + Math.sin(angle * 3 + robotX) * 0.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(
        rx + Math.cos(angle + robotYaw) * rayLen * scale,
        ry - Math.sin(angle + robotYaw) * rayLen * scale
      );
      ctx.stroke();
    }

    // Path line to active goal
    const activeGoal = goals.find(g => g.status === 'active');
    if (activeGoal) {
      ctx.strokeStyle = '#388BFD';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(cx + activeGoal.x * scale, cy - activeGoal.y * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Robot body
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-robotYaw);

    // Chassis
    ctx.fillStyle = '#21262D';
    ctx.strokeStyle = '#388BFD';
    ctx.lineWidth = 2;
    const rw = 0.3 * scale;
    const rh = 0.2 * scale;
    ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
    ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);

    // Direction arrow
    ctx.fillStyle = '#F0883E';
    ctx.beginPath();
    ctx.moveTo(rw / 2 + 5, 0);
    ctx.lineTo(rw / 2 - 5, -6);
    ctx.lineTo(rw / 2 - 5, 6);
    ctx.closePath();
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#484F58';
    ctx.fillRect(-rw / 2 - 3, -rh / 2 - 6, 6, 6);
    ctx.fillRect(-rw / 2 - 3, rh / 2, 6, 6);
    ctx.fillRect(rw / 2 - 3, -rh / 2 - 6, 6, 6);
    ctx.fillRect(rw / 2 - 3, rh / 2, 6, 6);

    ctx.restore();

    // Coordinate labels
    ctx.fillStyle = '#484F58';
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillText(`(${robotX.toFixed(2)}, ${robotY.toFixed(2)})`, rx + 20, ry - 20);

  }, [robotX, robotY, robotYaw, goals, zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click - set goal
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scale = 60 * zoom;
      const worldX = (mx - canvas.width / 2 - pan.x) / scale;
      const worldY = -(my - canvas.height / 2 - pan.y) / scale;
      onSetGoal(worldX, worldY);
    } else if (e.button === 1 || e.button === 2) {
      // Middle/right - pan
      setDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [zoom, pan, onSetGoal]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ width: '100%', height: '100%', cursor: dragging ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      />
      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button style={{ width: 32, height: 32, borderRadius: 6, background: '#161B22', border: '1px solid #30363D', color: '#8B949E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomIn size={16} />
        </button>
        <button style={{ width: 32, height: 32, borderRadius: 6, background: '#161B22', border: '1px solid #30363D', color: '#8B949E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomOut size={16} />
        </button>
      </div>
      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, left: 12, background: '#161B22CC', border: '1px solid #30363D', borderRadius: 6, padding: 8, fontSize: 10, color: '#8B949E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, background: '#21262D', border: '1px solid #388BFD' }} /> Robot
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, border: '1px solid #58A6FF', borderRadius: '50%' }} /> Goal
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, background: '#484F58' }} /> Obstacle
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 2, background: 'rgba(63, 185, 80, 0.5)' }} /> LiDAR
        </div>
      </div>
    </div>
  );
}

export default function Slam() {
  const { connected, odometry, slamActive, goals, startSlam, stopSlam, saveMap, addGoal, removeGoal, clearGoals, navigationActive } = useRos();
  const [mapName, setMapName] = useState('my_map');

  const robotYaw = (() => {
    const q = odometry.orientation;
    const siny = 2 * (q.w * q.z + q.x * q.y);
    const cosy = 1 - 2 * (q.y * q.y + q.z * q.z);
    return Math.atan2(siny, cosy);
  })();

  const handleSetGoal = useCallback((x: number, y: number) => {
    if (!connected) return;
    addGoal(x, y, 0);
  }, [connected, addGoal]);

  const activeGoal = goals.find(g => g.status === 'active');
  const distToGoal = activeGoal
    ? Math.sqrt((activeGoal.x - odometry.position.x) ** 2 + (activeGoal.y - odometry.position.y) ** 2)
    : 0;

  return (
    <div
      style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: '1fr auto',
        gap: 12,
        height: 'calc(100vh - 48px)',
        overflow: 'hidden',
      }}
    >
      {/* Map Canvas */}
      <div className="panel" style={{ gridColumn: 'span 9', padding: 0, overflow: 'hidden' }}>
        <MapCanvas
          robotX={odometry.position.x}
          robotY={odometry.position.y}
          robotYaw={robotYaw}
          goals={goals}
          zoom={1}
          onSetGoal={handleSetGoal}
        />
      </div>

      {/* Right sidebar */}
      <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        {/* SLAM Controls */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={16} color="#8B949E" />
            SLAM Controls
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!slamActive ? (
              <button onClick={startSlam} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Play size={14} /> Start SLAM
              </button>
            ) : (
              <button onClick={stopSlam} className="btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Square size={14} /> Stop SLAM
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              style={{
                flex: 1,
                background: '#21262D',
                border: '1px solid #30363D',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: '#E6EDF3',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <button onClick={() => saveMap(mapName)} className="btn-primary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Save size={14} /> Save
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: slamActive ? '#3FB950' : '#484F58' }} />
            <span style={{ fontSize: 12, color: slamActive ? '#3FB950' : '#484F58' }}>
              {slamActive ? 'Mapping Active' : 'SLAM Idle'}
            </span>
          </div>
        </div>

        {/* Waypoint Manager */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#8B949E" />
            Waypoints
          </div>

          <div style={{ fontSize: 11, color: '#484F58' }}>
            Click on map to set goals
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', flex: 1 }}>
            {goals.length === 0 && (
              <div style={{ fontSize: 12, color: '#484F58', textAlign: 'center', padding: '20px 0' }}>
                No waypoints set
              </div>
            )}
            {goals.map(goal => (
              <div
                key={goal.id}
                style={{
                  background: '#21262D',
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: goal.status === 'active' ? '1px solid #388BFD' : '1px solid transparent',
                }}
              >
                <Target size={14} color={goal.status === 'completed' ? '#3FB950' : goal.status === 'active' ? '#388BFD' : '#8B949E'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E6EDF3' }}>
                    ({goal.x.toFixed(2)}, {goal.y.toFixed(2)})
                  </div>
                  <div style={{ fontSize: 10, color: goal.status === 'completed' ? '#3FB950' : goal.status === 'active' ? '#388BFD' : '#484F58' }}>
                    {goal.status.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={14} color="#484F58" />
                </button>
              </div>
            ))}
          </div>

          {goals.length > 0 && (
            <button onClick={clearGoals} className="btn-danger" style={{ width: '100%' }}>
              Clear All
            </button>
          )}
        </div>

        {/* Navigation Status */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={16} color="#8B949E" />
            Navigation
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: navigationActive ? '#388BFD' : '#484F58' }} />
            <span style={{ fontSize: 12, color: '#E6EDF3' }}>
              {navigationActive ? (activeGoal ? 'Navigating' : 'Goal Reached') : 'Idle'}
            </span>
          </div>

          {activeGoal && (
            <>
              <div>
                <div style={{ fontSize: 11, color: '#484F58' }}>Distance to Goal</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: '#E6EDF3' }}>
                  {distToGoal.toFixed(2)} m
                </div>
              </div>

              <div style={{ height: 6, background: '#21262D', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(0, Math.min(100, (1 - distToGoal / 3) * 100))}%`,
                    background: '#388BFD',
                    borderRadius: 3,
                    transition: 'width 0.5s',
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: '#484F58' }}>
                Est. time: {distToGoal > 0 ? (distToGoal / 0.5).toFixed(0) : 0}s
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
