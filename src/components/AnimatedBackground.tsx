'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function AnimatedBackground() {
  const [orbs, setOrbs] = useState<Orb[]>([]);

  useEffect(() => {
    setOrbs(
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 200 + Math.random() * 400,
        delay: Math.random() * 4,
        duration: 8 + Math.random() * 8,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(234,88,12,0.04) 0%, transparent 60%), #09090b',
        }}
      />

      {/* Animated orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, rgba(249,115,22,0.06) 0%, rgba(234,88,12,0.03) 40%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.9, 1],
            opacity: [0.5, 0.8, 0.4, 0.5],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(9,9,11,0.8), transparent)',
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(9,9,11,0.8), transparent)',
        }}
      />
    </div>
  );
}
