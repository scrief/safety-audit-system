import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useSettings } from '../hooks/useSettings';

const Home = () => {
  const { loadSettings } = useSettings();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedSettings = async () => {
      const settings = await loadSettings();
      if (settings?.logo) {
        setLogo(settings.logo);
      }
    };
    loadSavedSettings();
  }, [loadSettings]);

  const primaryActions = [
    {
      name: 'New Audit',
      path: '/new-audit',
      description: 'Start a new safety audit',
      icon: '📋'
    },
    {
      name: 'Client Dashboard',
      path: '/clients',
      description: 'Manage your clients',
      icon: '👥'
    }
  ];

  const secondaryActions = [
    {
      name: 'Audit Responses',
      path: '/form-responses',
      description: 'View completed and draft audits',
      icon: '📝'
    },
    {
      name: 'Templates',
      path: '/saved-templates',
      description: 'Manage audit templates',
      icon: '📑'
    },
    {
      name: 'Settings',
      path: '/settings',
      description: 'Configure system settings',
      icon: '⚙️'
    },
    {
      name: 'Reports',
      path: '/reports',
      description: 'View audit reports and analytics',
      icon: '📊'
    }
  ];

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo Section */}
          <div className="mb-8">
            {logo && (
              <img 
                src={logo} 
                alt="Company logo" 
                className="h-12 w-auto object-contain"
              />
            )}
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {primaryActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white overflow-hidden shadow-lg rounded-lg 
                  hover:shadow-xl transition-shadow duration-300 
                  transform hover:-translate-y-1 transition-transform"
              >
                <div className="p-8">
                  <div className="text-3xl mb-4">{action.icon}</div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {action.name}
                  </h2>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {secondaryActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white overflow-hidden shadow rounded-lg 
                  hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="text-2xl mb-3">{action.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;