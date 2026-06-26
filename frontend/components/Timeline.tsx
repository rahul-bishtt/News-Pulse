'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { TimelineData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineProps {
  data: TimelineData[];
  onSelectCluster: (id: number) => void;
  selectedClusterId: number | null;
  loading?: boolean;
}

const MIN_BAR_WIDTH = 8;
const BAR_HEIGHT = 12;
const AXIS_HEIGHT = 28;
const PADDING = { left: 16, right: 16, top: 18, bottom: 8 };
const NUM_TICKS = 5;

function formatDateShort(ts: number): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(ts));
}

function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Indigo-400 → Indigo-600 based on intensity (0–1) */
function intensityFill(intensity: number): string {
  // Low: indigo-300 (#a5b4fc), High: indigo-600 (#4f46e5)
  const r = Math.round(165 + (79 - 165) * intensity);
  const g = Math.round(180 + (70 - 180) * intensity);
  const b = Math.round(252 + (229 - 252) * intensity);
  return `rgb(${r},${g},${b})`;
}

export const Timeline: React.FC<TimelineProps> = ({
  data,
  onSelectCluster,
  selectedClusterId,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const chartLeft = PADDING.left;
  const chartRight = width - PADDING.right;
  const chartWidth = Math.max(chartRight - chartLeft, 1);

  const timestamps = data.flatMap((d) => [
    new Date(d.startTime).getTime(),
    new Date(d.endTime).getTime(),
  ]);
  const domainMin = timestamps.length ? Math.min(...timestamps) : Date.now() - 86400000;
  const domainMax = timestamps.length ? Math.max(...timestamps) : Date.now();
  const domainSpan = Math.max(domainMax - domainMin, 1);

  function xScale(ts: number): number {
    return chartLeft + ((ts - domainMin) / domainSpan) * chartWidth;
  }

  const svgHeight = PADDING.top + BAR_HEIGHT + AXIS_HEIGHT + PADDING.bottom;

  const ticks: number[] = Array.from({ length: NUM_TICKS }, (_, i) =>
    domainMin + (domainSpan / (NUM_TICKS - 1)) * i,
  );

  const rangeLabel =
    data.length > 0
      ? `${formatDateFull(data[0].startTime)} – ${formatDateFull(data[data.length - 1].endTime)} · ${data.length} topics`
      : '';

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>News Timeline</CardTitle>
          <CardDescription>Loading topic data…</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 space-y-3">
          {[82, 55, 70, 38].map((w, i) => (
            <Skeleton
              key={i}
              className="h-3 rounded-full"
              style={{ width: `${w}%`, marginLeft: `${i * 4}%` }}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  /* ── Empty state ── */
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>News Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Newspaper size={36} strokeWidth={1.5} />
          <p className="text-sm text-center">
            No topics found. Use the{' '}
            <span className="text-foreground font-medium">Refresh</span> button to ingest the
            latest articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>News Timeline</CardTitle>
        <CardDescription>{rangeLabel}</CardDescription>
      </CardHeader>

      <CardContent className="pb-4 pt-2">
        {/* SVG swimlane chart */}
        <div ref={containerRef} className="w-full overflow-x-auto">
          <svg
            width={width}
            height={svgHeight}
            className="block select-none"
            style={{ minWidth: 280 }}
          >
            {/* Baseline */}
            <line
              x1={chartLeft}
              y1={PADDING.top + BAR_HEIGHT + 6}
              x2={chartRight}
              y2={PADDING.top + BAR_HEIGHT + 6}
              stroke="#27272a"
              strokeWidth={1}
            />

            {/* Cluster bars */}
            {data.map((cluster) => {
              const x1 = xScale(new Date(cluster.startTime).getTime());
              const x2 = xScale(new Date(cluster.endTime).getTime());
              const barW = Math.max(MIN_BAR_WIDTH, x2 - x1);
              const isSelected = selectedClusterId === cluster.id;

              return (
                <g
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Native SVG tooltip */}
                  <title>
                    {cluster.label} · {cluster.articleCount} article
                    {cluster.articleCount !== 1 ? 's' : ''}
                    {'\n'}
                    {formatDateFull(cluster.startTime)}
                    {cluster.startTime !== cluster.endTime
                      ? ` – ${formatDateFull(cluster.endTime)}`
                      : ''}
                  </title>

                  {/* Bar */}
                  <rect
                    x={x1}
                    y={PADDING.top}
                    width={barW}
                    height={BAR_HEIGHT}
                    rx={BAR_HEIGHT / 2}
                    fill={intensityFill(cluster.intensity)}
                    opacity={isSelected ? 1 : 0.55}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                    style={{ transition: 'opacity 150ms' }}
                  />

                  {/* Inline label for wide bars */}
                  {barW > 80 && (
                    <text
                      x={x1 + 8}
                      y={PADDING.top + BAR_HEIGHT / 2 + 4}
                      fontSize={9}
                      fill="rgba(255,255,255,0.85)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {cluster.label.length > 22
                        ? cluster.label.slice(0, 22) + '…'
                        : cluster.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* X-axis ticks */}
            {ticks.map((ts, i) => {
              const x = xScale(ts);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={PADDING.top + BAR_HEIGHT + 6}
                    x2={x}
                    y2={PADDING.top + BAR_HEIGHT + 11}
                    stroke="#3f3f46"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={PADDING.top + BAR_HEIGHT + 24}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#71717a"
                    style={{ userSelect: 'none' }}
                  >
                    {formatDateShort(ts)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Topic chips — quick select, especially useful on mobile */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {data.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => onSelectCluster(cluster.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 border ${
                selectedClusterId === cluster.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              }`}
            >
              {cluster.label}
              <span className="ml-1.5 opacity-60">{cluster.articleCount}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
