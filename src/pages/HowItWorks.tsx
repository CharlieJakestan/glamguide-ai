import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Camera, Brain, Palette, MapPin } from 'lucide-react';

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Camera className="h-8 w-8 text-purple-600" />,
      title: "Facial Analysis",
      description: "Use your camera to capture your face. Our AI analyzes your facial features, skin tone, face shape, and unique characteristics to understand what makeup styles will work best for you."
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "AI Processing",
      description: "Our advanced AI processes your facial data along with your location, weather conditions, and personal preferences to create personalized makeup recommendations tailored specifically for you."
    },
    {
      icon: <Palette className="h-8 w-8 text-purple-600" />,
      title: "Personalized Looks",
      description: "Get customized makeup looks based on your analysis. Choose from professional, casual, or party looks that complement your features and current conditions."
    },
    {
      icon: <MapPin className="h-8 w-8 text-purple-600" />,
      title: "Smart Recommendations",
      description: "Receive location-aware suggestions considering local weather, humidity, and temperature. Get product recommendations based on what you already own and your skin's medical conditions."
    }
  ];

  const features = [
    "Real-time facial feature analysis",
    "Skin tone and face shape detection",
    "Weather-aware makeup suggestions",
    "Personal product inventory tracking",
    "Medical skin condition considerations",
    "Step-by-step application guidance",
    "Voice-guided instructions",
    "Multiple regional makeup styles"
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="outline" onClick={() => navigate('/')} className="mr-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-purple-800">How SmyraAI Works</h1>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-purple-700">
                Your Personal AI Makeup Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center text-lg">
                SmyraAI uses advanced artificial intelligence and computer vision to analyze your unique features 
                and provide personalized makeup recommendations that work perfectly for you, your environment, 
                and your lifestyle.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {steps.map((step, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    {step.icon}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-700">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-700">The Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-semibold text-lg">1. Initial Setup</h3>
                <p className="text-gray-600">Allow camera access and location permissions for the best experience.</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-semibold text-lg">2. Facial Capture</h3>
                <p className="text-gray-600">Position your face in the camera frame and let our AI analyze your features.</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-semibold text-lg">3. Personal Information</h3>
                <p className="text-gray-600">Tell us about your makeup products, skin conditions, and preferences.</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-semibold text-lg">4. Get Recommendations</h3>
                <p className="text-gray-600">Receive personalized makeup looks with step-by-step instructions.</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-semibold text-lg">5. Apply & Perfect</h3>
                <p className="text-gray-600">Follow voice-guided instructions to achieve your perfect look.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => navigate('/camera')} 
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3"
          >
            Try SmyraAI Now
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;