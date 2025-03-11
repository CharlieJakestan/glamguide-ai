
import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-purple-800">
                GlamGuide AI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/looks" className="text-gray-700 hover:text-purple-800">
                Makeup Looks
              </Link>
              <Link to="/camera" className="text-gray-700 hover:text-purple-800">
                Try Now
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
