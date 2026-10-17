import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ScannerPage } from './pages/ScannerPage';
import { ResultsPage } from './pages/ResultsPage';
import { RemediationPage } from './pages/RemediationPage';
import { HistoryPage } from './pages/HistoryPage';
import { SecurityGuidePage } from './pages/SecurityGuidePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="results/:scanId" element={<ResultsPage />} />
            <Route path="remediation" element={<RemediationPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="guide" element={<SecurityGuidePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
