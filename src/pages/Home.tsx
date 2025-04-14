
import React from 'react';
import Layout from '@/components/Layout';

const Home: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center">Welcome to GlowAI</h1>
        <p className="text-center mt-4">Your personal AI makeup assistant</p>
      </div>
    </Layout>
  );
};

export default Home;
