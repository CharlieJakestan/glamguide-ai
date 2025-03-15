
import React, { useState, useEffect } from 'react';

const MAKEUP_TIPS = [
  "Glow with a soft blush!",
  "For natural brows, brush them upward first.",
  "Hydrate lips before applying lipstick.",
  "Apply concealer in a triangle under eyes.",
  "Set your makeup with a fine mist setting spray.",
  "Cream blush gives a natural dewy finish.",
  "Use an eyeshadow primer for longer-lasting color.",
  "Apply mascara from roots to tips for fuller lashes.",
  "Warm cream products with fingertips before applying.",
  "Use a small brush for precise highlight application."
];

const MakeupTips: React.FC = () => {
  const [randomTip, setRandomTip] = useState<string>("");
  
  useEffect(() => {
    getRandomTip();
  }, []);
  
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MAKEUP_TIPS.length);
    setRandomTip(MAKEUP_TIPS[randomIndex]);
  };
  
  if (!randomTip) return null;
  
  return (
    <div className="bg-pink-50 text-pink-600 p-3 rounded-md mb-6 text-center italic">
      💄 {randomTip}
    </div>
  );
};

export default MakeupTips;
