import { Routes, Route } from 'react-router';
import { RosProvider } from '@/contexts/RosContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/pages/Dashboard';
import Teleop from '@/pages/Teleop';
import Slam from '@/pages/Slam';
import Topics from '@/pages/Topics';
import RobotModel from '@/pages/RobotModel';
import Config from '@/pages/Config';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

function AppLayout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gridTemplateRows: '48px 1fr', height: '100vh', overflow: 'hidden' }}>
      <div style={{ gridRow: '1 / -1', gridColumn: 1 }}>
        <Sidebar />
      </div>
      <div style={{ gridRow: 1, gridColumn: 2 }}>
        <TopBar />
      </div>
      <div style={{ gridRow: 2, gridColumn: 2, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/teleop" element={<Teleop />} />
          <Route path="/slam" element={<Slam />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/robot" element={<RobotModel />} />
          <Route path="/config" element={<Config />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RosProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </RosProvider>
  );
}
