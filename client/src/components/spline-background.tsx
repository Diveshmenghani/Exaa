import { Suspense, lazy } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import ParticleBackground from './particle-background';

// Lazy load Spline to improve performance
const Spline = lazy(() => import('@splinetool/react-spline'));

// Check if WebGL is available
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

export default function SplineBackground() {
  const isMobile = useIsMobile();

  // On mobile or when WebGL is not available, fallback to particle background
  if (isMobile || (typeof window !== 'undefined' && !isWebGLAvailable())) {
    return <ParticleBackground />;
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <Suspense
        fallback={
          <div className="absolute inset-0 z-0">
            <ParticleBackground />
          </div>
        }
      >
        <div 
          className="absolute inset-0 transform scale-150 opacity-70"
          style={{
            pointerEvents: 'none',
            filter: 'blur(0.5px)',
          }}
        >
          <Spline
            scene="https://prod.spline.design/OOAhkTxk9aILA8E8/scene.splinecode"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.2)',
              zIndex: -1,
            }}
            onLoad={() => {
              console.log('Spline scene loaded successfully');
            }}
            onError={(error: any) => {
              console.warn('Spline scene failed to load:', error);
            }}
          />
        </div>
      </Suspense>
    </div>
  );
}