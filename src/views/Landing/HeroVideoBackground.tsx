import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface HeroVideoBackgroundProps {
  videoId: string;
  start?: number;
  end?: number;
}

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({
  videoId,
  start = 0,
  end = 43,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let intervalId: any = null;
    let isMounted = true;

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player || !containerRef.current) return;

      const playerElementId = 'hero-yt-player';
      let existingDiv = document.getElementById(playerElementId);
      if (!existingDiv && containerRef.current) {
        existingDiv = document.createElement('div');
        existingDiv.id = playerElementId;
        containerRef.current.appendChild(existingDiv);
      }

      try {
        playerRef.current = new window.YT.Player(playerElementId, {
          videoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            loop: 1,
            playlist: videoId,
            start,
            end,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            modestbranding: 1,
            fs: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              event.target.mute();
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              if (
                event.data === window.YT.PlayerState.ENDED ||
                event.data === window.YT.PlayerState.PAUSED
              ) {
                event.target.seekTo(start);
                event.target.playVideo();
              }
            },
          },
        });

        // Polling loop interval to cleanly loop right at 43s without delay
        intervalId = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            if (currentTime >= end) {
              playerRef.current.seekTo(start);
              playerRef.current.playVideo();
            }
          }
        }, 250);
      } catch {}
    };

    if (!window.YT || !window.YT.Player) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        if (isMounted) createPlayer();
      };
    } else {
      createPlayer();
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch {}
    };
  }, [videoId, start, end]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* 16:9 Aspect ratio container to prevent any letterboxing */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100vw',
          height: '56.25vw',
          minWidth: '177.77vh',
          minHeight: '100%',
          transform: 'translate(-50%, -50%) scale(1.18)',
          pointerEvents: 'none',
        }}
      />

      {/* Cinematic dark theme overlay for high text contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(180deg, rgba(6, 9, 19, 0.45) 0%, rgba(6, 9, 19, 0.72) 55%, rgba(6, 9, 19, 0.92) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
