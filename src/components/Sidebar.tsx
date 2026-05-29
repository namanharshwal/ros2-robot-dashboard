import { useLocation, useNavigate } from 'react-router';
import {
  Activity,
  Gamepad2,
  Map,
  Radio,
  Cpu,
  Settings,
  LogOut,
} from 'lucide-react';
import { useRos } from '@/contexts/RosContext';
import { useState } from 'react';

const navItems = [
  { icon: Activity, label: 'Dashboard', path: '/' },
  { icon: Gamepad2, label: 'Teleoperation', path: '/teleop' },
  { icon: Map, label: 'SLAM & Nav', path: '/slam' },
  { icon: Radio, label: 'Topics', path: '/topics' },
  { icon: Cpu, label: 'Robot Model', path: '/robot' },
  { icon: Settings, label: 'Configuration', path: '/config' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useRos();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <nav
      style={{
        width: 64,
        background: '#161B22',
        borderRight: '1px solid #30363D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        zIndex: 50,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#388BFD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            color: '#FFF',
          }}
        >
          GT
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item, idx) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: 'none',
                background: active ? 'rgba(56, 139, 253, 0.15)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s',
              }}
            >
              <Icon
                size={20}
                color={active ? '#58A6FF' : hoveredIdx === idx ? '#8B949E' : '#484F58'}
                strokeWidth={active ? 2.5 : 2}
              />
              {hoveredIdx === idx && (
                <div
                  style={{
                    position: 'absolute',
                    left: 52,
                    background: '#21262D',
                    border: '1px solid #30363D',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#E6EDF3',
                    whiteSpace: 'nowrap',
                    zIndex: 100,
                    pointerEvents: 'none',
                  }}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={disconnect}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        title="Disconnect"
      >
        <LogOut size={20} color="#484F58" />
      </button>
    </nav>
  );
}
