import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useSettings } from '../hooks/useSettings';

interface SettingsState {
  companyName: string;
  logo: string | null;
  defaultEmailDomain: string;
  notificationEmail: string;
  theme: 'light' | 'dark' | 'system';
}

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>({
    companyName: '',
    logo: null,
    defaultEmailDomain: '',
    notificationEmail: '',
    theme: 'light'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { saveSettings, loadSettings } = useSettings();

  useEffect(() => {
    const loadExistingSettings = async () => {
      const savedSettings = await loadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    };
    loadExistingSettings();
  }, [loadSettings]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Logo file must be smaller than 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          logo: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate email format if provided
      if (settings.notificationEmail && !isValidEmail(settings.notificationEmail)) {
        throw new Error('Invalid notification email format');
      }

      // Validate domain format if provided
      if (settings.defaultEmailDomain && !isValidDomain(settings.defaultEmailDomain)) {
        throw new Error('Invalid email domain format');
      }

      await saveSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      
      // Navigate to home page after a brief delay to show success message
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Helper functions for validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
          
          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            {/* Company Information Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={e => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                <div className="mt-1 flex items-center space-x-4">
                  {settings.logo && (
                    <img
                      src={settings.logo}
                      alt="Company logo"
                      className="h-12 w-auto object-contain"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Recommended size: 200x50px. Max file size: 5MB</p>
              </div>
            </div>

            {/* Email Settings Section */}
            <div className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Email Domain</label>
                <input
                  type="text"
                  value={settings.defaultEmailDomain}
                  onChange={e => setSettings(prev => ({ ...prev, defaultEmailDomain: e.target.value }))}
                  placeholder="example.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Email</label>
                <input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={e => setSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Theme Settings */}
            <div className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={settings.theme}
                  onChange={e => setSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'system' }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="pt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 