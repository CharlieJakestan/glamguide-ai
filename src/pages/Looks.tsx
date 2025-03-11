
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

const looks = [
  {
    id: 1,
    name: 'Professional Meeting',
    description: 'Polished and subtle makeup for business settings',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
  {
    id: 2,
    name: 'Evening Glam',
    description: 'Sophisticated evening makeup with dramatic elements',
    image: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9',
  },
  {
    id: 3,
    name: 'Natural Day Look',
    description: 'Fresh and natural makeup for everyday wear',
    image: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b',
  },
  {
    id: 4,
    name: 'Party Ready',
    description: 'Bold and vibrant makeup for special occasions',
    image: 'https://images.unsplash.com/photo-1596742578443-7682ef2b7d75',
  },
];

const Looks = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-800 mb-8">Makeup Looks</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {looks.map((look) => (
            <div key={look.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src={look.image}
                  alt={look.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{look.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{look.description}</p>
                <Button
                  onClick={() => navigate('/camera')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Try This Look
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Looks;
