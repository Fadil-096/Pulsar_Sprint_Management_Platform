import React, { useRef, useEffect } from 'react';

export const AdvancedSpaceBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animId;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Very large number of stars for a rich space effect
    const numStars = 800;
    const stars = [];
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2, // Parallax depth
        radius: Math.random() * 1.2 + 0.1, // Very small stars
        baseOpacity: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.8 ? (Math.random() > 0.5 ? '#b4d2ff' : '#ffd2b4') : '#ffffff'
      });
    }

    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Subtle deep space glow in the center
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
      gradient.addColorStop(0, 'rgba(15, 20, 35, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        // Slow horizontal drift for parallax effect
        star.x -= (1 - star.z) * 0.15; 
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }

        // Twinkling effect using sine wave
        star.twinklePhase += star.twinkleSpeed;
        const currentOpacity = star.baseOpacity + Math.sin(star.twinklePhase) * 0.4;
        const clampedOpacity = Math.max(0.05, Math.min(1, currentOpacity));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = clampedOpacity;
        ctx.fill();
      });
      
      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}
    />
  );
};
