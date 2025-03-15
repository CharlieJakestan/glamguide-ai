
import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

// Extended makeup tips with product information
const MAKEUP_TIPS = [
  {
    tip: "Glow with a soft blush!",
    products: ["Cream blush", "Powder blush", "Cheek tint"],
    technique: "Apply to the apples of cheeks and blend upward toward temples"
  },
  {
    tip: "For natural brows, brush them upward first.",
    products: ["Clear brow gel", "Tinted brow gel", "Brow brush"],
    technique: "Use short, upward strokes to mimic natural hair growth"
  },
  {
    tip: "Hydrate lips before applying lipstick.",
    products: ["Lip balm", "Lip scrub", "Lip primer"],
    technique: "Gently exfoliate, then apply balm and blot before lipstick"
  },
  {
    tip: "Apply concealer in a triangle under eyes.",
    products: ["Liquid concealer", "Concealer brush", "Beauty sponge"],
    technique: "Draw a triangle shape and blend outward for brightening effect"
  },
  {
    tip: "Set your makeup with a fine mist setting spray.",
    products: ["Setting spray", "Facial mist", "Fixing spray"],
    technique: "Hold bottle 8-10 inches away and spray in an X and T motion"
  },
  {
    tip: "Cream blush gives a natural dewy finish.",
    products: ["Cream blush stick", "Cream blush pot", "Tinted moisturizer"],
    technique: "Apply with fingertips by tapping onto cheeks for a natural flush"
  },
  {
    tip: "Use an eyeshadow primer for longer-lasting color.",
    products: ["Eyeshadow primer", "Concealer", "Eye base"],
    technique: "Apply a thin layer and let it set for 30 seconds before eyeshadow"
  },
  {
    tip: "Apply mascara from roots to tips for fuller lashes.",
    products: ["Volumizing mascara", "Curling mascara", "Eyelash curler"],
    technique: "Wiggle wand at the base of lashes then pull through to tips"
  },
  {
    tip: "Warm cream products with fingertips before applying.",
    products: ["Cream contour", "Cream foundation", "Cream highlighter"],
    technique: "Warm product between fingers then press and blend into skin"
  },
  {
    tip: "Use a small brush for precise highlight application.",
    products: ["Fan brush", "Tapered highlight brush", "Powder highlighter"],
    technique: "Apply to high points: cheekbones, brow bone, nose tip, and cupid's bow"
  }
];

const MakeupTips: React.FC = () => {
  const [currentTip, setCurrentTip] = useState<typeof MAKEUP_TIPS[0] | null>(null);
  const [showProductInfo, setShowProductInfo] = useState(false);
  
  useEffect(() => {
    getRandomTip();
    
    // Rotate tips every 30 seconds
    const interval = setInterval(() => {
      getRandomTip();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MAKEUP_TIPS.length);
    setCurrentTip(MAKEUP_TIPS[randomIndex]);
    setShowProductInfo(false);
  };
  
  if (!currentTip) return null;
  
  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-md mb-6 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 text-pink-500 mr-2" />
            <p className="text-pink-600 italic font-medium">{currentTip.tip}</p>
          </div>
          
          {showProductInfo && (
            <div className="mt-2 pl-6 text-sm">
              <p className="text-purple-700 font-medium">Recommended Products:</p>
              <ul className="list-disc list-inside text-purple-600 mt-1">
                {currentTip.products.map((product, idx) => (
                  <li key={idx}>{product}</li>
                ))}
              </ul>
              
              <p className="text-purple-700 font-medium mt-2">Technique:</p>
              <p className="text-purple-600">{currentTip.technique}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowProductInfo(!showProductInfo)}
          className="text-xs px-2 py-1 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded transition-colors"
        >
          {showProductInfo ? "Hide Details" : "Show Products"}
        </button>
      </div>
    </div>
  );
};

export default MakeupTips;
