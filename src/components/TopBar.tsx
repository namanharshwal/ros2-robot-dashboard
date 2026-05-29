import { useLocation } from 'react-router';
import { AlertOctagon, Battery, BatteryMedium, BatteryLow, BatteryWarning, BatteryFull } from 'lucide-react';
import { useRos } from '@/contexts/RosContext';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/teleop': 'Teleoperation',
  '/slam': 'SLAM & Navigation',
  '/topics': 'Topic Monitor',
  '/robot': 'Robot Model',
  '/config': 'Configuration',
};

function getPageTitle(path: string) {
  return pageNames[path] || 'Dashboard';
}

function BatteryIcon({ percentage }: { percentage: number }) {
  if (percentage > 80) return <BatteryFull size={18} color="#3FB950" />;
  if (percentage > 50) return <BatteryMedium size={18} color="#3FB950" />;
  if (percentage > 20) return <BatteryLow size={18} color="#D29922" />;
  return <BatteryWarning size={18} color="#F85149" />;
}

export default function TopBar() {
  const location = useLocation();
  const { connected, connecting, battery, emergencyStop, connect, disconnect } = useRos();
  const [showEStopDialog, setShowEStopDialog] = useState(false);

  return (
    <>
      <header
        style={{
          height: 48,
          background: '#161B22',
          borderBottom: '1px solid #30363D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        {/* Left: Connection + Robot Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {connected ? (
            <span className="status-badge-online pulse-green">
              Connected
            </span>
          ) : connecting ? (
            <span className="status-badge-warning">
              Connecting...
            </span>
          ) : (
            <span className="status-badge-offline">
              Disconnected
            </span>
          )}

          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 15,
              color: '#E6EDF3',
            }}
          >
            GT100-Diff
          </span>

          <span
            style={{
              fontSize: 11,
              color: '#8B949E',
              background: '#21262D',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #30363D',
            }}
          >
            Humble
          </span>

          {!connected && !connecting && (
            <button
              onClick={connect}
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Connect
            </button>
          )}
          {connected && (
            <button
              onClick={disconnect}
              className="btn-danger"
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Center: Page Title */}
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 16,
            color: '#E6EDF3',
          }}
        >
          {getPageTitle(location.pathname)}
        </div>

        {/* Right: Battery + E-Stop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: '#21262D',
              borderRadius: 6,
              border: '1px solid #30363D',
            }}
          >
            <BatteryIcon percentage={battery.percentage} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 500,
                color: battery.percentage > 20 ? '#E6EDF3' : '#F85149',
              }}
            >
              {Math.round(battery.percentage)}%
            </span>
          </div>

          <button
            onClick={() => setShowEStopDialog(true)}
            title="Emergency Stop"
            style={{
              width: 32,
              height: 32,
              background: '#F85149',
              border: 'none',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FF6B63';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F85149';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <AlertOctagon size={18} color="#FFF" />
          </button>
        </div>
      </header>

      <Dialog open={showEStopDialog} onOpenChange={setShowEStopDialog}>
        <DialogContent style={{ background: '#161B22', border: '1px solid #30363D' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#F85149', fontFamily: 'var(--font-heading)' }}>
              Emergency Stop
            </DialogTitle>
            <DialogDescription style={{ color: '#8B949E' }}>
              This will immediately halt all robot motors and set velocity commands to zero.
              Are you sure you want to activate emergency stop?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ gap: 8 }}>
            <Button
              variant="outline"
              onClick={() => setShowEStopDialog(false)}
              style={{ background: '#21262D', borderColor: '#30363D', color: '#E6EDF3' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                emergencyStop();
                setShowEStopDialog(false);
              }}
              style={{ background: '#F85149', color: '#FFF' }}
            >
              Activate E-Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
