import React, { useState, useEffect } from 'react';
import { useLoader } from '../context/LoaderContext';
import { AdvancedSpaceBackground } from './AdvancedSpaceBackground';
const messages = [
  "Initialising workspace...",
  "Loading your sprints...",
  "Preparing your dashboard...",
  "Almost there..."
];

export const PostLoginLoader = () => {
  const { isLoading, isDismissing } = useLoader();
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [introPhase, setIntroPhase] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      
      // Phase 1: Fade to black
      setTimeout(() => setIntroPhase(1), 20);
      
      // Phase 2: Fade in loader content
      const phaseTimer = setTimeout(() => {
        setIntroPhase(2);
      }, 500);

      const interval = setInterval(() => {
        const timePassed = Date.now() - startTime;
        setElapsed(timePassed);
        if (timePassed > 8000) setShowWarning(true);
        if (timePassed > 15000) setShowRetry(true);
      }, 1000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(phaseTimer);
      };
    } else {
      setElapsed(0);
      setShowWarning(false);
      setShowRetry(false);
      setMessageIndex(0);
      setIntroPhase(0);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <>
      <style>{`
        @keyframes pulsarRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes shimmerProgress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fillProgress {
          0% { width: 0%; }
          100% { width: 85%; }
        }
        @keyframes finalRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(6); opacity: 0; }
        }
        
        .loader-ring {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1.5px solid rgba(99, 179, 255, 0.6);
          border-radius: 50%;
          animation: pulsarRing 1.8s ease-out infinite;
        }
        .loader-ring-1 { animation-delay: 0s; }
        .loader-ring-2 { animation-delay: 0.6s; }
        .loader-ring-3 { animation-delay: 1.2s; }

        .loader-ring-final {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 2px solid rgba(99, 179, 255, 0.9);
          border-radius: 50%;
          animation: finalRing 600ms ease-out forwards;
        }

        .progress-bar {
          background: linear-gradient(90deg, rgba(37,99,235,0.8), rgba(99,179,255,1), rgba(37,99,235,0.8));
          background-size: 200% 100%;
          animation: shimmerProgress 1.5s linear infinite;
          box-shadow: 0 0 10px rgba(99,179,255,0.6);
        }

        .message-transition {
          transition: opacity 0.4s ease;
        }
      `}</style>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDismissing ? 0 : (introPhase >= 1 ? 1 : 0),
          transition: 'opacity 500ms ease',
          pointerEvents: 'none'
        }}
      >
        
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: introPhase === 2 ? 1 : 0,
          transition: 'opacity 600ms ease'
        }}>
          <AdvancedSpaceBackground />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Element 1: Pulsar Logo */}
          <img 
            src="/Pulsar_logo_transparent.png" 
            alt="Pulsar" 
            style={{ 
              width: '380px',
              mixBlendMode: 'lighten',
              filter: 'brightness(1.2) contrast(1.15) saturate(0) drop-shadow(0 0 35px rgba(255, 255, 255, 0.4))'
            }} 
          />

          {/* Element 2: Animated loading indicator */}
          <div style={{ marginTop: '24px', position: 'relative', width: '8px', height: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'rgba(99, 179, 255, 0.9)',
              boxShadow: '0 0 12px rgba(99, 179, 255, 0.8)',
              position: 'absolute',
              zIndex: 2
            }} />
            
            {!isDismissing ? (
              <>
                <div className="loader-ring loader-ring-1" />
                <div className="loader-ring loader-ring-2" />
                <div className="loader-ring loader-ring-3" />
              </>
            ) : (
              <div className="loader-ring-final" />
            )}
          </div>

          {/* Element 3: Loading text */}
          <div style={{
            marginTop: '28px',
            position: 'relative',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="message-transition"
                style={{
                  position: 'absolute',
                  fontSize: '16px',
                  letterSpacing: '3px',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 400,
                  opacity: (!isDismissing && idx === messageIndex) ? 1 : 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {msg}
              </div>
            ))}
          </div>

          {/* Extended loading warnings */}
          {showWarning && (
            <div style={{
              marginTop: '16px',
              fontSize: '13px',
              letterSpacing: '2px',
              color: 'rgba(251,191,36,0.7)',
              fontWeight: 300,
              opacity: isDismissing ? 0 : 1,
              transition: 'opacity 0.4s ease',
              animation: 'fade-in 0.4s ease'
            }}>
              Taking longer than usual...
            </div>
          )}
          {showRetry && (
            <div style={{
              marginTop: '8px',
              opacity: isDismissing ? 0 : 1,
              pointerEvents: 'auto'
            }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  fontSize: '13px',
                  letterSpacing: '2px',
                  color: 'rgba(99,179,255,0.8)',
                  fontWeight: 300,
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        </div>

        {/* Element 4: Progress Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: 'rgba(255,255,255,0.05)',
          opacity: introPhase === 2 ? 1 : 0,
          transition: 'opacity 600ms ease'
        }}>
          <div 
            className="progress-bar"
            style={{
              height: '100%',
              width: isDismissing ? '100%' : '85%',
              transition: isDismissing ? 'width 0.1s ease' : 'width 3s cubic-bezier(0.1, 0.8, 0.3, 1)'
            }}
          />
        </div>
      </div>
    </>
  );
};
