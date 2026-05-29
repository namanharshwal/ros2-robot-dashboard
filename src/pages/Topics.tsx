import { useRos } from '@/contexts/RosContext';
import { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Radio,
  ChevronRight,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TopicInfo } from '@/types/ros';

// Sparkline mini chart
function Sparkline({ data, color = '#388BFD' }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sparkfill)"
      />
    </svg>
  );
}

// JSON tree viewer
function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  if (data === null) return <span style={{ color: '#484F58' }}>null</span>;
  if (typeof data === 'boolean') return <span style={{ color: '#D29922' }}>{String(data)}</span>;
  if (typeof data === 'number') return <span style={{ color: '#58A6FF' }}>{data}</span>;
  if (typeof data === 'string') return <span style={{ color: '#3FB950' }}>{`"${data}"`}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: '#484F58' }}>[]</span>;
    return (
      <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
        <span style={{ color: '#484F58' }}>[</span>
        {data.slice(0, 20).map((item, i) => (
          <div key={i} style={{ paddingLeft: 16 }}>
            <JsonTree data={item} depth={depth + 1} />
            {i < Math.min(data.length, 20) - 1 && <span style={{ color: '#484F58' }}>,</span>}
          </div>
        ))}
        {data.length > 20 && <div style={{ paddingLeft: 16, color: '#484F58' }}>... {data.length - 20} more items</div>}
        <span style={{ color: '#484F58' }}>]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span style={{ color: '#484F58' }}>{'{}'}</span>;
    return (
      <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
        <span style={{ color: '#484F58' }}>{'{'}</span>
        {entries.map(([key, value], i) => (
          <div key={key} style={{ paddingLeft: 16 }}>
            <span style={{ color: '#E6EDF3' }}>{key}</span>
            <span style={{ color: '#484F58' }}>: </span>
            <JsonTree data={value} depth={depth + 1} />
            {i < entries.length - 1 && <span style={{ color: '#484F58' }}>,</span>}
          </div>
        ))}
        <span style={{ color: '#484F58' }}>{'}'}</span>
      </div>
    );
  }

  return <span style={{ color: '#484F58' }}>{String(data)}</span>;
}

// Topic message samples
const topicSamples: Record<string, unknown> = {
  '/cmd_vel': {
    linear: { x: 0.5, y: 0.0, z: 0.0 },
    angular: { x: 0.0, y: 0.0, z: 0.1 },
  },
  '/odom': {
    header: { seq: 1247, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: 'odom' },
    child_frame_id: 'base_footprint',
    pose: {
      pose: {
        position: { x: 1.234, y: 0.567, z: 0.0 },
        orientation: { x: 0.0, y: 0.0, z: 0.104, w: 0.995 },
      },
      covariance: [0.1, 0, 0, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1],
    },
    twist: {
      twist: {
        linear: { x: 0.5, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.1 },
      },
      covariance: [0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01],
    },
  },
  '/scan': {
    header: { seq: 45231, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: 'laser_link' },
    angle_min: -3.14159,
    angle_max: 3.14159,
    angle_increment: 0.00436,
    range_min: 0.12,
    range_max: 12.0,
    ranges: Array.from({ length: 1440 }, (_, i) => 0.5 + Math.sin(i * 0.1) * 2 + Math.random() * 0.5),
    intensities: Array.from({ length: 1440 }, () => 47.0),
  },
  '/battery': {
    header: { seq: 1203, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: 'base_link' },
    voltage: 23.8,
    current: -1.2,
    charge: 7.8,
    capacity: 10.0,
    design_capacity: 10.0,
    percentage: 0.78,
    power_supply_status: 2,
    power_supply_health: 0,
    present: true,
    cell_voltage: [3.95, 3.97, 3.96, 3.94],
    location: 'main_battery',
    serial_number: 'GT100-2401',
  },
  '/joint_states': {
    header: { seq: 89234, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: '' },
    name: ['left_wheel_joint', 'right_wheel_joint'],
    position: [45.23, 45.18],
    velocity: [23.5, 23.2],
    effort: [0.12, 0.11],
  },
  '/map': {
    header: { seq: 1, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: 'map' },
    info: {
      map_load_time: { secs: 1699000, nsecs: 0 },
      resolution: 0.05,
      width: 400,
      height: 400,
      origin: { position: { x: -10.0, y: -10.0, z: 0.0 }, orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 } },
    },
    data: 'Array(160000) [-1, -1, -1, 0, 0, 100, ...]',
  },
  '/tf': {
    transforms: [
      {
        header: { seq: 0, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: 'odom' },
        child_frame_id: 'base_footprint',
        transform: {
          translation: { x: 1.234, y: 0.567, z: 0.0 },
          rotation: { x: 0.0, y: 0.0, z: 0.104, w: 0.995 },
        },
      },
    ],
  },
  '/imu': {
    header: { seq: 45123, stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: 'imu_link' },
    orientation: { x: 0.0, y: 0.0, z: 0.104, w: 0.995 },
    orientation_covariance: [0.002, 0, 0, 0, 0.002, 0, 0, 0, 0.002],
    angular_velocity: { x: 0.0, y: 0.0, z: 0.1 },
    angular_velocity_covariance: [0.0004, 0, 0, 0, 0.0004, 0, 0, 0, 0.0004],
    linear_acceleration: { x: 0.05, y: 0.02, z: 9.81 },
    linear_acceleration_covariance: [0.01, 0, 0, 0, 0.01, 0, 0, 0, 0.01],
  },
};

function getSample(topicName: string): unknown {
  return topicSamples[topicName] || {
    header: { seq: Math.floor(Math.random() * 100000), stamp: { secs: 1699123, nsecs: 456000000 }, frame_id: '' },
    data: `Sample data for ${topicName}`,
  };
}

export default function Topics() {
  const { topics } = useRos();
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<TopicInfo | null>(null);
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set(['/']));
  const [showRaw, setShowRaw] = useState(false);

  // Group topics by namespace
  const grouped = useMemo(() => {
    const groups: Record<string, TopicInfo[]> = {};
    const filtered = topics.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase())
    );
    for (const topic of filtered) {
      const parts = topic.name.split('/');
      const ns = parts.length > 2 ? '/' + parts[1] : '/';
      if (!groups[ns]) groups[ns] = [];
      groups[ns].push(topic);
    }
    return groups;
  }, [topics, search]);

  // Sparkline data generator
  const sparkData = useMemo(() => {
    return Array.from({ length: 50 }, () => 5 + Math.random() * 5);
  }, []);

  const toggleNamespace = (ns: string) => {
    setExpandedNamespaces(prev => {
      const next = new Set(prev);
      if (next.has(ns)) next.delete(ns);
      else next.add(ns);
      return next;
    });
  };

  const totalBw = topics.reduce((sum, t) => sum + t.bandwidth, 0);
  const activeCount = topics.filter(t => t.active).length;

  return (
    <div
      style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 12,
        height: 'calc(100vh - 48px)',
        overflow: 'hidden',
      }}
    >
      {/* Topic List */}
      <div className="panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Radio size={16} color="#8B949E" />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3' }}>
              Topics ({topics.length})
            </span>
            <span style={{ fontSize: 11, color: '#3FB950', marginLeft: 'auto' }}>
              {activeCount} active
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#21262D', borderRadius: 6, border: '1px solid #30363D' }}>
            <Search size={14} color="#484F58" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter topics..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: 12,
                color: '#E6EDF3',
                fontFamily: 'var(--font-body)',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#484F58', fontFamily: 'var(--font-mono)' }}>
            <span>Name</span>
            <span>Hz</span>
          </div>
        </div>

        <ScrollArea style={{ flex: 1 }}>
          {Object.entries(grouped).map(([ns, nsTopics]) => (
            <div key={ns}>
              <button
                onClick={() => toggleNamespace(ns)}
                style={{
                  width: '100%',
                  padding: '6px 16px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  color: '#8B949E',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {expandedNamespaces.has(ns) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {ns}
              </button>
              {expandedNamespaces.has(ns) && nsTopics.map(topic => (
                <div
                  key={topic.name}
                  onClick={() => setSelectedTopic(topic)}
                  className="topic-item"
                  style={{
                    padding: '6px 16px 6px 32px',
                    background: selectedTopic?.name === topic.name ? '#21262D' : undefined,
                    borderLeft: selectedTopic?.name === topic.name ? '2px solid #388BFD' : '2px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: topic.active ? '#3FB950' : '#484F58', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#E6EDF3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {topic.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {topic.hz.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Message Inspector */}
      <div className="panel" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedTopic ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #30363D' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16, color: '#E6EDF3' }}>
                    {selectedTopic.name}
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedTopic.active ? '#3FB950' : '#484F58' }} />
                </div>
                <div style={{ fontSize: 11, color: '#8B949E', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {selectedTopic.type}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontFamily: 'var(--font-gauge)', fontWeight: 700, color: '#388BFD' }}>
                    {selectedTopic.hz.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: '#484F58' }}>Hz</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontFamily: 'var(--font-gauge)', fontWeight: 700, color: '#F0883E' }}>
                    {selectedTopic.bandwidth.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: '#484F58' }}>KB/s</div>
                </div>
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid #30363D',
                    background: showRaw ? '#388BFD' : '#21262D',
                    color: showRaw ? '#FFF' : '#8B949E',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {showRaw ? 'Tree' : 'Raw'}
                </button>
              </div>
            </div>

            {/* Sparkline */}
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={14} color="#8B949E" />
              <Sparkline data={sparkData} />
              <span style={{ fontSize: 10, color: '#484F58' }}>5s window</span>
            </div>

            {/* Message data */}
            <ScrollArea style={{ flex: 1, background: '#0D1117', borderRadius: 6, border: '1px solid #30363D' }}>
              <div style={{ padding: 12 }}>
                {showRaw ? (
                  <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E6EDF3', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(getSample(selectedTopic.name), null, 2)}
                  </pre>
                ) : (
                  <JsonTree data={getSample(selectedTopic.name)} />
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#484F58' }}>
            <Radio size={48} />
            <div style={{ fontSize: 14 }}>Select a topic to inspect</div>
            <div style={{ fontSize: 12 }}>Total bandwidth: {totalBw.toFixed(1)} KB/s across {topics.length} topics</div>
          </div>
        )}
      </div>
    </div>
  );
}
