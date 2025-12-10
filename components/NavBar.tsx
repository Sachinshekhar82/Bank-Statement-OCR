
import React from 'react';
import { ChartIcon, FileIcon, NumberIcon } from './icons';

interface NavBarProps {
  onNavigate: (sectionId: string) => void;
  activeSection?: string;
}

const NavBar: React.FC<NavBarProps> = ({ onNavigate, activeSection }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <NumberIcon className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <ChartIcon className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <FileIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="sticky top-4 z-50 w-full flex justify-center mb-8 animate-fade-in pointer-events-none">
      <div className="pointer-events-auto flex items-center p-1.5 space-x-1 bg-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              activeSection === item.id 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavBar;
