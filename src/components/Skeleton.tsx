import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-card-muted)',
        ...style,
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ height?: number | string }> = ({ height = 180 }) => {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width: '100%',
        height,
        borderRadius: '16px',
        background: 'var(--bg-card)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <Skeleton width="40%" height={22} />
      <Skeleton width="80%" height={14} />
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        <Skeleton width={80} height={32} borderRadius={8} />
        <Skeleton width={110} height={32} borderRadius={8} />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number; itemHeight?: number }> = ({
  count = 3,
  itemHeight = 56,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          height={itemHeight}
          borderRadius={10}
          style={{ background: 'var(--bg-card)' }}
        />
      ))}
    </div>
  );
};
