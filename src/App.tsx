import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import { ClientProvider } from './contexts/ClientContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { AuditProvider } from './contexts/AuditContext';
import { ResponsesProvider } from './contexts/ResponsesContext';
import Settings from './pages/Settings';

function App() {
  return (
    <ResponsesProvider>
      <AuditProvider>
        <TemplateProvider>
          <ClientProvider>
            <Router>
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Router>
          </ClientProvider>
        </TemplateProvider>
      </AuditProvider>
    </ResponsesProvider>
  );
}

export default App;