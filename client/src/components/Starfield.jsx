import React, { useRef, useEffect } from 'react';

export const Starfield = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animId;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    let cx = width / 2;
    let cy = height / 2;
    
    const numStars = 400;
    const stars = [];
    
    const initStar = () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      color: Math.random() > 0.95 ? '#ffe8d0' : '#e8f0ff'
    });

    for (let i = 0; i < numStars; i++) {
      stars.push(initStar());
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 5, 0.15)';
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        star.z -= star.z * 0.015 + 0.1;

        if (star.z <= 0) {
          Object.assign(star, initStar());
          star.z = width;
        }

        const sx = (star.x / star.z) * width + cx;
        const sy = (star.y / star.z) * height + cy;

        if (sx < 0 || sx > width || sy < 0 || sy > height) {
          Object.assign(star, initStar());
          star.z = width;
          return;
        }

        const size = Math.max(0.5, (1 - star.z / width) * 3);
        const opacity = Math.max(0.2, 1 - (star.z / width));

        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, 2 * Math.PI);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = star.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      cx = width / 2;
      cy = height / 2;
    };
    window.addEventListener('resize', handleResize);

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else animId = requestAnimationFrame(animate);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, backgroundColor: '#000005' }}
    />
  );
};
