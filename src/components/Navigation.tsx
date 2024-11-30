import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { routes } from '../routes';
import { SvgIconProps } from '@mui/material';
import { CustomRouteObject } from '../types/route';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Filter routes that should be shown in navigation
  const navItems = routes.filter((route: CustomRouteObject) => 
    route.showInNav !== false && route.path !== undefined
  ) as CustomRouteObject[];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            {navItems.map((item: CustomRouteObject) => (
              <button
                key={item.path}
                onClick={() => item.path && navigate(item.path)}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                  location.pathname === item.path
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {item.icon && React.createElement(item.icon, {
                  className: 'mr-2 h-5 w-5',
                  fontSize: 'small'
                } as SvgIconProps)}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 