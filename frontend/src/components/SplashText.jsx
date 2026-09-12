import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SPLASH_MESSAGES = [
  "100 * (Level ^ 1.5) XP!",
  "Drink your protein buttermilk!",
  "10 Hearts. Survival Mode!",
  "Eat Paneer & Soya Chunks!",
  "1.5 Hour Gym Split!",
  "Implement LightGBM Model!",
  "TCET IT-D Assignments complete!",
  "Don't lose your half-hearts!",
  "Level up your Discipline!",
  "Unified Biomes of Life!"
];

export default function SplashText() {
  const [splash] = useState(() => {
    const randomIndex = Math.floor(Math.random() * SPLASH_MESSAGES.length);
    return SPLASH_MESSAGES[randomIndex];
  });

  return (
    <motion.div
      animate={{
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute -bottom-3 right-0 sm:right-6 md:right-12 z-20 pointer-events-none transform -rotate-12 origin-center"
    >
      <span className="font-pixel text-[#ffff55] text-xs sm:text-sm md:text-base tracking-wider text-shadow-splash whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-none border border-black/50">
        {splash}
      </span>
    </motion.div>
  );
}
