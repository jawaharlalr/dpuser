import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

const FallingEmojis = ({ config }) => {
  const [docHeight, setDocHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setDocHeight(Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ));
    };
    
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const particles = useMemo(() => {
    if (!config) return [];
    // 1. INCREASED COUNT: 50-60 particles feel much more "festive"
    const count = 60; 
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      // 2. DYNAMIC DURATION: Based on page height so they don't move too fast on long pages
      duration: (docHeight / 100) + Math.random() * 10 + 15, 
      // 3. CONTINUITY: Large negative delay ensures emojis start mid-screen immediately
      delay: Math.random() * -50,       
      size: Math.random() * 20 + 12,
      drift: (Math.random() - 0.5) * 120,
      rotation: Math.random() * 360,
      // 4. RANDOM START POSITION: Prevents the "top-heavy" start
      initialY: Math.random() * -1000 - 100, 
    }));
  }, [config, docHeight]); // Re-calculate if height changes significantly

  if (!config || particles.length === 0) return null;

  const { emoji, animation = "float" } = config;

  const getVariants = (type, p) => {
    if (type === "pop") return {
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      y: ["0px", `${(Math.random() - 0.5) * 600}px`],
      x: ["0px", `${(Math.random() - 0.5) * 600}px`],
    };

    // waterfall animation
    return {
      // Start slightly above the top, end below the dynamic docHeight
      y: [-200, docHeight + 200], 
      x: [0, p.drift, -p.drift, p.drift], // Complex swaying path
      opacity: [0, 1, 1, 0], // Fade in at top, fade out at bottom
      rotate: [p.rotation, p.rotation + 720], // Continuous tumbling
    };
  };

  return (
    <div 
      className="absolute inset-x-0 top-0 pointer-events-none z-[0] overflow-hidden"
      style={{ height: docHeight, width: '100%' }} 
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            y: p.initialY, // Start at various heights off-screen
            opacity: 0 
          }}
          animate={getVariants(animation, p)}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            ease: "linear", 
            delay: p.delay 
          }}
          style={{ 
            position: "absolute", 
            fontSize: p.size + "px",
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
            left: `${p.left}%`,
            // Smoother rendering for lots of moving parts
            willChange: "transform", 
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
};

export default FallingEmojis;