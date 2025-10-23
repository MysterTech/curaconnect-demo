
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SessionProvider } from './context/SessionContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastNotification';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { ActiveSessionUpdated } from './pages/ActiveSessionUpdated';
import { SimpleRecordingPage } from './pages/SimpleRecordingPage';
import { SessionReview } from './pages/SessionReview';
import { SessionHistory } from './pages/SessionHistory';
import { SessionWorkspace } from './pages/SessionWorkspace';
import { Settings } from './pages/Settings';
import './App.css';

const NotFound = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SessionProvider>
          <Router>
            <AppLayout>
              <Routes>
                {/* Dashboard */}
                <Route path="/" element={<Dashboard />} />
                
                {/* Session routes - Now using new Workspace UI */}
                <Route path="/session/new" element={<SessionWorkspace />} />
                <Route path="/session/:sessionId" element={<SessionWorkspace />} />
                <Route path="/session/:sessionId/review" element={<SessionReview />} />
                <Route path="/sessions" element={<SessionHistory />} />
                
                {/* Workspace UI (same as session routes) */}
                {/* Legacy routes for backward compatibility */}
                <Route path="/session-old/:sessionId" element={<ActiveSessionUpdated />} />
                
                {/* Simple recorder (standalone) */}
                <Route path="/simple-recorder" element={<SimpleRecordingPage />} />
                
                {/* Settings */}
                <Route path="/settings" element={<Settings />} />
                
                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
            <ToastContainer />
          </Router>
        </SessionProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
