
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Camera,
  BookOpen,
  Settings,
  PenSquare,
  Sparkles,
  User,
  Database
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { path: '/makeup-style', label: 'Makeup Style', icon: <PenSquare className="h-5 w-5" /> },
    { path: '/gan-generator', label: 'AI Makeup', icon: <Sparkles className="h-5 w-5" /> },
    { path: '/knowledge', label: 'Knowledge', icon: <Database className="h-5 w-5" /> },
    { path: '/camera-test', label: 'Camera', icon: <Camera className="h-5 w-5" /> },
    { path: '/tutorials', label: 'Tutorials', icon: <BookOpen className="h-5 w-5" /> },
    { path: '/profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];
  
  return (
    <nav className="bg-white p-4 shadow-sm border-b">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-bold text-xl text-pink-600">BeautyAI</span>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-center">
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
