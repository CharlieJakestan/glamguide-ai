
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, UserCheck, ChevronRight, Info, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

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
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-xl rounded-full transition-transform hover:transform hover:scale-105 mb-16"
        >
          Start Your Makeover
          <ChevronRight className="ml-2 h-6 w-6" />
        </Button>
        
        {/* About Section */}
        <div className="w-full max-w-4xl mx-auto mb-16" id="about">
          <div className="flex items-center mb-6">
            <Info className="h-8 w-8 text-purple-600 mr-3" />
            <h2 className="text-3xl font-bold text-purple-800">About GlamGuide AI</h2>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8">
            <p className="text-gray-700 mb-4">
              GlamGuide AI is a revolutionary makeup assistant that combines computer vision with artificial intelligence to provide personalized makeup guidance in real-time.
            </p>
            <p className="text-gray-700 mb-4">
              Unlike traditional tutorials, our AI analyzes your unique facial features and makeup application as you apply it, offering instant feedback and adjustments to help you achieve your desired look.
            </p>
            <p className="text-gray-700">
              With cultural makeup styles from around the world and product substitution suggestions, GlamGuide AI ensures you can create beautiful looks with the products you already have.
            </p>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="w-full max-w-4xl mx-auto mb-16" id="how-it-works">
          <div className="flex items-center mb-6">
            <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
            <h2 className="text-3xl font-bold text-purple-800">How This Works</h2>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8">
            <ol className="list-decimal list-inside space-y-4 text-left">
              <li className="text-gray-700">
                <span className="font-semibold">Select a Look:</span> Browse our collection of makeup styles from different cultures around the world.
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Position Your Camera:</span> Our AI needs to see your face clearly to provide accurate guidance.
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Follow Voice Guidance:</span> Listen to our AI's personalized instructions that adapt in real-time as you apply your makeup.
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Get Live Feedback:</span> The AI will analyze your application technique and provide instant adjustments.
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Product Substitutions:</span> Don't have a specific product? Our AI will suggest alternatives from your collection.
              </li>
            </ol>
            <div className="mt-6 text-center">
              <Link to="/auth">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Sign In to Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
