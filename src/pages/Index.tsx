
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, UserCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-purple-800 mb-6">
          Your Personal AI Makeup Assistant
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Get personalized makeup recommendations, try virtual looks, and follow step-by-step guidance
          for any occasion.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-6 bg-white rounded-xl shadow-md transition-transform hover:transform hover:scale-105">
            <Camera className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Live Analysis</h3>
            <p className="text-gray-600 mb-4">Real-time facial feature analysis for personalized recommendations</p>
            <Button
              variant="outline"
              onClick={() => navigate('/camera')}
              className="w-full"
            >
              Try Now
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md transition-transform hover:transform hover:scale-105">
            <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Virtual Try-On</h3>
            <p className="text-gray-600 mb-4">Preview different makeup looks before applying</p>
            <Button
              variant="outline"
              onClick={() => navigate('/looks')}
              className="w-full"
            >
              Browse Looks
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md transition-transform hover:transform hover:scale-105">
            <UserCheck className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Guidance</h3>
            <p className="text-gray-600 mb-4">Step-by-step instructions customized to your features</p>
            <Button
              variant="outline"
              onClick={() => navigate('/camera')}
              className="w-full"
            >
              Get Started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={() => navigate('/camera')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-xl rounded-full transition-transform hover:transform hover:scale-105"
        >
          Start Your Makeover
          <ChevronRight className="ml-2 h-6 w-6" />
        </Button>
      </div>
    </Layout>
  );
};

export default Index;
