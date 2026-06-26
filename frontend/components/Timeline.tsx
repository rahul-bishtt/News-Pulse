'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Newspaper, CalendarDays } from 'lucide-react';
import { TimelineData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineProps {
  data: TimelineData[];
  onSelectCluster: (id: number) => void;
  selectedClusterId: number | null;
  searchQuery: string;
  loading?: boolean;
}

const MIN_BAR_WIDTH = 12;
const BAR_HEIGHT = 16;
const LANE_HEIGHT = 26;
const AXIS_HEIGHT = 32;
const PADDING = { left: 16, right: 16, top: 16, bottom: 8 };
const NUM_TICKS = 6;

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
  const r = Math.round(165 + (79 - 165) * intensity);
  const g = Math.round(180 + (70 - 180) * intensity);
  const b = Math.round(252 + (229 - 252) * intensity);
  return `rgb(${r},${g},${b})`;
}

export const Timeline: React.FC<TimelineProps> = ({
  data,
  onSelectCluster,
  selectedClusterId,
  searchQuery,
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

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight">Timeline Visualization</CardTitle>
          <CardDescription>Calculating chronology…</CardDescription>
        </CardHeader>
        <CardContent className="pb-8 space-y-4">
          {[82, 55, 70, 38].map((w, i) => (
            <Skeleton
              key={i}
              className="h-4 rounded-full"
              style={{ width: `${w}%`, marginLeft: `${i * 3}%` }}
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
          <CardTitle className="text-sm font-semibold tracking-tight">Timeline Visualization</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Newspaper size={36} strokeWidth={1.5} />
          <p className="text-sm text-center">
            No topics found. Click the <span className="text-foreground font-medium">Refresh</span> button to ingest news articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter topics by search query
  const filteredData = data.filter((topic) =>
    topic.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const chartLeft = PADDING.left;
  const chartRight = width - PADDING.right;
  const chartWidth = Math.max(chartRight - chartLeft, 1);

  // Compute boundaries using full dataset (to lock timeline view during searches)
  const timestamps = data.flatMap((d) => [
    new Date(d.startTime).getTime(),
    new Date(d.endTime).getTime(),
  ]);
  const domainMin = Math.min(...timestamps);
  const domainMax = Math.max(...timestamps);
  const domainSpan = Math.max(domainMax - domainMin, 1);

  function xScale(ts: number): number {
    return chartLeft + ((ts - domainMin) / domainSpan) * chartWidth;
  }

  // Stagger overlapping topics into lanes (calculated using all data for consistency)
  const sortedAll = [...data].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const lanesEndTimes: number[] = [];
  const topicLanes: Record<number, number> = {};

  for (const topic of sortedAll) {
    const start = new Date(topic.startTime).getTime();
    const end = new Date(topic.endTime).getTime();
    let assigned = -1;

    // Minimum gap buffer between pills on the same lane (e.g. 4 hours)
    const gapBuffer = 4 * 60 * 60 * 1000;

    for (let i = 0; i < lanesEndTimes.length; i++) {
      if (start > lanesEndTimes[i] + gapBuffer) {
        assigned = i;
        lanesEndTimes[i] = end;
        break;
      }
    }

    if (assigned === -1) {
      assigned = lanesEndTimes.length;
      lanesEndTimes.push(end);
    }
    topicLanes[topic.id] = assigned;
  }

  const numLanes = Math.max(lanesEndTimes.length, 1);
  const svgHeight = PADDING.top + numLanes * LANE_HEIGHT + AXIS_HEIGHT + PADDING.bottom;

  // Build grid ticks
  const ticks: number[] = Array.from({ length: NUM_TICKS }, (_, i) =>
    domainMin + (domainSpan / (NUM_TICKS - 1)) * i,
  );

  const rangeLabel = `${formatDateFull(data[0].startTime)} – ${formatDateFull(data[data.length - 1].endTime)} · ${data.length} topics total`;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <CardTitle className="text-sm font-semibold tracking-tight">Timeline Visualization</CardTitle>
        </div>
        <CardDescription>{rangeLabel}</CardDescription>
      </CardHeader>

      <CardContent className="pb-4 pt-1">
        <div ref={containerRef} className="w-full overflow-x-auto relative">
          <svg
            width={width}
            height={svgHeight}
            className="block select-none"
            style={{ minWidth: 280 }}
          >
            {/* Dashed grid ticks */}
            {ticks.map((ts, i) => {
              const x = xScale(ts);
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={x}
                    y1={PADDING.top}
                    x2={x}
                    y2={PADDING.top + numLanes * LANE_HEIGHT + 6}
                    stroke="#27272a"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={x}
                    y1={PADDING.top + numLanes * LANE_HEIGHT + 6}
                    x2={x}
                    y2={PADDING.top + numLanes * LANE_HEIGHT + 11}
                    stroke="#3f3f46"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={PADDING.top + numLanes * LANE_HEIGHT + 24}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#71717a"
                    className="font-medium"
                  >
                    {formatDateShort(ts)}
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line
              x1={chartLeft}
              y1={PADDING.top + numLanes * LANE_HEIGHT + 6}
              x2={chartRight}
              y2={PADDING.top + numLanes * LANE_HEIGHT + 6}
              stroke="#27272a"
              strokeWidth={1}
            />

            {/* Swimlane Topic bars */}
            {filteredData.map((cluster) => {
              const x1 = xScale(new Date(cluster.startTime).getTime());
              const x2 = xScale(new Date(cluster.endTime).getTime());
              const barW = Math.max(MIN_BAR_WIDTH, x2 - x1);
              const isSelected = selectedClusterId === cluster.id;
              const laneIndex = topicLanes[cluster.id] ?? 0;
              const y = PADDING.top + laneIndex * LANE_HEIGHT;

              return (
                <g
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster.id)}
                  className="cursor-pointer group"
                >
                  <title>
                    {cluster.label} · {cluster.articleCount} article
                    {cluster.articleCount !== 1 ? 's' : ''}
                    {'\n'}
                    {formatDateFull(cluster.startTime)}
                    {cluster.startTime !== cluster.endTime
                      ? ` – ${formatDateFull(cluster.endTime)}`
                      : ''}
                  </title>

                  {/* Staggered Rect */}
                  <rect
                    x={x1}
                    y={y}
                    width={barW}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={intensityFill(cluster.intensity)}
                    opacity={isSelected ? 1 : 0.65}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                    className="transition-all duration-150 group-hover:opacity-100"
                  />

                  {/* Text inside or above bar */}
                  {barW > 90 && (
                    <text
                      x={x1 + 6}
                      y={y + 11}
                      fontSize={9}
                      fontWeight="500"
                      fill="#ffffff"
                      style={{ pointerEvents: 'none' }}
                      className="opacity-90"
                    >
                      {cluster.label.length > 20
                        ? cluster.label.slice(0, 20) + '…'
                        : cluster.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
