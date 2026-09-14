import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

export interface BlazeTransitionRef {
  startTransition: (onSwap: () => void) => void;
}

const TOTAL_FRAMES = 70;
const SWAP_FRAME = 24;
const FRAME_STEP = 1; // 1 = 60fps, 2 = 30fps

export const BlazeTransitionOverlay = forwardRef<BlazeTransitionRef, { reducedMotion?: boolean }>(
  ({ reducedMotion }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const animationFrameId = useRef<number | null>(null);

    // Preload frames in the background
    useEffect(() => {
      const loaded: HTMLImageElement[] = [];
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(3, '0');
        img.src = `/transitions/blaze/frame_${frameNum}.webp`;
        loaded.push(img);
      }
      imagesRef.current = loaded;

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      startTransition: (onSwap: () => void) => {
        if (reducedMotion) {
          onSwap();
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas || imagesRef.current.length === 0) {
          onSwap();
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onSwap();
          return;
        }

        setIsAnimating(true);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);

        let currentFrame = 0;
        let hasSwapped = false;
        let lastTimestamp = performance.now();
        const frameInterval = 1000 / 60; // 60 FPS target

        const renderFrame = (timestamp: number) => {
          const delta = timestamp - lastTimestamp;

          if (delta >= frameInterval) {
            lastTimestamp = timestamp - (delta % frameInterval);

            currentFrame += FRAME_STEP;

            // Trigger page swap at peak of explosion
            if (currentFrame >= SWAP_FRAME && !hasSwapped) {
              hasSwapped = true;
              onSwap();
            }

            if (currentFrame >= TOTAL_FRAMES) {
              // Finish transition
              ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
              setIsAnimating(false);
              return;
            }

            const img = imagesRef.current[currentFrame];
            if (img && img.complete && img.naturalWidth > 0) {
              const canvasW = window.innerWidth;
              const canvasH = window.innerHeight;

              ctx.clearRect(0, 0, canvasW, canvasH);

              // Calculate cover aspect ratio
              const imgW = img.naturalWidth;
              const imgH = img.naturalHeight;
              const imgRatio = imgW / imgH;
              const canvasRatio = canvasW / canvasH;

              let renderW = canvasW;
              let renderH = canvasH;
              let offsetX = 0;
              let offsetY = 0;

              if (canvasRatio > imgRatio) {
                renderW = canvasW;
                renderH = canvasW / imgRatio;
                offsetY = (canvasH - renderH) / 2;
              } else {
                renderH = canvasH;
                renderW = canvasH * imgRatio;
                offsetX = (canvasW - renderW) / 2;
              }

              // Smooth fade-out in final frames
              if (currentFrame > 45) {
                const fadeProgress = (currentFrame - 45) / (TOTAL_FRAMES - 45);
                ctx.globalAlpha = Math.max(0, 1 - fadeProgress);
              } else {
                ctx.globalAlpha = 1.0;
              }

              ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
            }
          }

          animationFrameId.current = requestAnimationFrame(renderFrame);
        };

        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        animationFrameId.current = requestAnimationFrame(renderFrame);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`blaze-transition-canvas ${isAnimating ? 'active' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          pointerEvents: 'none',
          display: isAnimating ? 'block' : 'none',
          mixBlendMode: 'screen',
        }}
      />
    );
  }
);

BlazeTransitionOverlay.displayName = 'BlazeTransitionOverlay';
