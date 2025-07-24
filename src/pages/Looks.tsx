
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { MakeupLook } from '@/types/makeup';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import professionalMeetingImage from '@/assets/professional-meeting-indian.jpg';
import casualDayImage from '@/assets/casual-day-indian.jpg';
import casualNightImage from '@/assets/casual-night-indian.jpg';

const Looks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [looks, setLooks] = useState<MakeupLook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Predefined looks with images
  const predefinedLooks = [
    {
      id: 'professional-meeting',
      name: 'Professional Meeting',
      description: 'Perfect for business meetings and corporate events',
      image: professionalMeetingImage,
      products: [],
      instructions: [
        { step: 1, description: 'Apply primer for a smooth base' },
        { step: 2, description: 'Use medium coverage foundation' },
        { step: 3, description: 'Apply neutral eyeshadow' },
        { step: 4, description: 'Use brown eyeliner for definition' },
        { step: 5, description: 'Apply mascara for natural lashes' },
        { step: 6, description: 'Use nude or pink lipstick' }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 'casual-day',
      name: 'Casual Day Look',
      description: 'Fresh and natural for everyday wear',
      image: casualDayImage,
      products: [],
      instructions: [
        { step: 1, description: 'Apply tinted moisturizer' },
        { step: 2, description: 'Use concealer only where needed' },
        { step: 3, description: 'Apply cream blush for natural glow' },
        { step: 4, description: 'Use clear or brown mascara' },
        { step: 5, description: 'Apply tinted lip balm' }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 'casual-night',
      name: 'Casual Night Look',
      description: 'Glamorous yet relaxed for evening outings',
      image: casualNightImage,
      products: [],
      instructions: [
        { step: 1, description: 'Apply full coverage foundation' },
        { step: 2, description: 'Create smoky eye with dark eyeshadow' },
        { step: 3, description: 'Use black eyeliner and winged technique' },
        { step: 4, description: 'Apply dramatic mascara or false lashes' },
        { step: 5, description: 'Add highlighter for glow' },
        { step: 6, description: 'Use bold lip color' }
      ],
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const fetchLooks = async () => {
      try {
        const { data, error } = await supabase.from('makeup_looks').select('*');
        
        let dbLooks: MakeupLook[] = [];
        if (!error && data) {
          // Parse JSONB fields
          dbLooks = data.map(look => ({
            ...look,
            products: typeof look.products === 'string' ? JSON.parse(look.products) : look.products,
            instructions: typeof look.instructions === 'string' ? JSON.parse(look.instructions) : look.instructions,
          }));
        }
        
        // Combine predefined looks with database looks
        setLooks([...predefinedLooks, ...dbLooks]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching looks:', error);
        // If database fails, just use predefined looks
        setLooks(predefinedLooks);
        setIsLoading(false);
      }
    };
    
    fetchLooks();
  }, [toast]);

  // Function to try on a specific look
  const tryLook = (lookId: string) => {
    // Store selected look ID in session storage to retrieve in Camera page
    sessionStorage.setItem('selectedLookId', lookId);
    navigate('/camera');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800">Makeup Looks</h1>
          
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <Button 
              onClick={() => navigate('/camera')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Try Custom Look
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {looks.map((look) => (
              <div key={look.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 overflow-hidden">
                  {(look as any).image ? (
                    <img 
                      src={(look as any).image} 
                      alt={look.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-purple-100 h-full flex items-center justify-center">
                      <div className="text-4xl text-purple-300 font-bold">{look.name.charAt(0)}</div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{look.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{look.description}</p>
                  <Button
                    onClick={() => tryLook(look.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Try This Look
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Looks;
