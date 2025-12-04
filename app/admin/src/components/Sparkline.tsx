import { useMemo } from 'react';

interface SparklineProps {
  data: number[]; // 7 data points
  width?: number; // default 120
  height?: number; // default 40
  color?: string; // default teal
  showDots?: boolean; // default false
  ariaLabel?: string; // custom accessibility label
}

function Sparkline({ 
  data, 
  width = 120, 
  height = 40, 
  color = 'var(--cl-accent)', 
  showDots = false,
  ariaLabel 
}: SparklineProps) {
  const { pathData, fillPathData, points, trendLabel } = useMemo(() => {
    if (data.length === 0) {
      return { pathData: '', fillPathData: '', points: [], trendLabel: 'No data' };
    }

    // Normalize data to fit within the SVG viewBox
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero
    
    // Add padding to prevent clipping at edges
    const padding = height * 0.1;
    const effectiveHeight = height - (padding * 2);
    
    // Calculate points
    const pointsArray = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const normalizedValue = (value - min) / range;
      const y = height - padding - (normalizedValue * effectiveHeight);
      return { x, y };
    });

    // Generate smooth curve using quadratic bezier
    let path = `M ${pointsArray[0].x} ${pointsArray[0].y}`;
    
    for (let i = 0; i < pointsArray.length - 1; i++) {
      const current = pointsArray[i];
      const next = pointsArray[i + 1];
      
      // Calculate control point for smooth curve
      const controlX = (current.x + next.x) / 2;
      
      path += ` Q ${controlX} ${current.y}, ${next.x} ${next.y}`;
    }

    // Create fill path by closing the shape at the bottom
    const fillPath = `${path} L ${width} ${height} L 0 ${height} Z`;

    // Determine trend for accessibility
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    let trend = 'stable';
    
    if (lastValue > firstValue * 1.1) {
      trend = 'increasing';
    } else if (lastValue < firstValue * 0.9) {
      trend = 'decreasing';
    }

    const trendDescription = `7-day trend: ${trend}`;

    return { 
      pathData: path, 
      fillPathData: fillPath, 
      points: pointsArray,
      trendLabel: trendDescription
    };
  }, [data, width, height]);

  const gradientId = useMemo(() => `sparkline-gradient-${Math.random().toString(36).substring(2, 11)}`, []);
  const glowId = useMemo(() => `sparkline-glow-${Math.random().toString(36).substring(2, 11)}`, []);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      width={width} 
      height={height}
      aria-label={ariaLabel || trendLabel}
      role="img"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Gradient fill */}
      <path 
        d={fillPathData} 
        fill={`url(#${gradientId})`}
        style={{ opacity: 0.8 }}
      />
      
      {/* Main stroke line */}
      <path 
        d={pathData} 
        stroke={color} 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
      
      {/* Glow effect line */}
      <path 
        d={pathData} 
        stroke={color} 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.3 }}
      />
      
      {/* Optional dots at data points */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2"
          fill={color}
        />
      ))}
    </svg>
  );
}

export default Sparkline;
