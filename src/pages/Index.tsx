
import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Eye, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const Index = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block mb-1">Virtual Makeup</span>
            <span className="block text-purple-600">Try-On Experience</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Try on different makeup looks in real-time and get personalized recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-4 flex justify-center">
                <Camera className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Try On Camera</h3>
              <p className="text-gray-500 mb-4">
                Use your camera to try on makeup looks in real-time with our augmented reality technology.
              </p>
              <Link to="/camera">
                <Button className="w-full">
                  Start Camera
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-4 flex justify-center">
                <Heart className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Browse Looks</h3>
              <p className="text-gray-500 mb-4">
                Explore our collection of curated makeup looks from natural to glamorous styles.
              </p>
              <Link to="/looks">
                <Button className="w-full">
                  View Looks
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-4 flex justify-center">
                <Sparkles className="h-12 w-12 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI Makeup Generator</h3>
              <p className="text-gray-500 mb-4">
                Generate unique AI-powered makeup looks with our custom GAN model.
              </p>
              <Link to="/gan-generator">
                <Button className="w-full" variant="pink">
                  Generate Looks
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-12">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Technology</h2>
            <p className="text-gray-600 mb-4">
              Our virtual makeup application combines computer vision with augmented reality to let you try on makeup looks without having to apply actual products. The app detects your facial features in real-time and overlays makeup effects precisely.
            </p>
            <p className="text-gray-600">
              We've also incorporated AI technology that can generate unique makeup looks using Generative Adversarial Networks (GAN), trained on thousands of professional makeup applications.
            </p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How This Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Choose your approach</h3>
                <p className="text-gray-600">Try the live camera experience or generate AI looks</p>
              </div>
              <div>
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Experiment with looks</h3>
                <p className="text-gray-600">Try different styles or adjust intensity to match your preferences</p>
              </div>
              <div>
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Save your favorites</h3>
                <p className="text-gray-600">Download images of your preferred looks to use as reference</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
