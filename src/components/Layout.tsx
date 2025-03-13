
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching session:', error);
        setLoading(false);
      }
    };
    
    getInitialSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-purple-800">
                GlamGuide AI
              </Link>
              <div className="hidden md:flex ml-10 space-x-8">
                <a href="/#about" className="text-gray-700 hover:text-purple-800">
                  About
                </a>
                <a href="/#how-it-works" className="text-gray-700 hover:text-purple-800">
                  How This Works
                </a>
                <Link to="/looks" className="text-gray-700 hover:text-purple-800">
                  Makeup Looks
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
              ) : user ? (
                <>
                  <Link to="/camera" className="text-gray-700 hover:text-purple-800">
                    Try Now
                  </Link>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-700 truncate max-w-[120px]">
                        {user.email?.split('@')[0]}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="text-purple-700 border-purple-300 hover:bg-purple-50">
                    Sign In
                  </Button>
                </Link>
              )}
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
