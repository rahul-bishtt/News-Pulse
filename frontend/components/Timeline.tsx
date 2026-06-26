'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, CalendarDays, FileText, ChevronDown } from 'lucide-react';
import { TimelineData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface TimelineProps {
  data: TimelineData[];
  onSelectCluster: (id: number) => void;
  selectedClusterId: number | null;
  searchQuery: string;
  loading?: boolean;
}

const INITIAL_VISIBLE_COUNT = 25;
const NUM_TICKS = 6;

function formatDateShort(ts: number): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(ts));
}

function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export const Timeline: React.FC<TimelineProps> = ({
  data,
  onSelectCluster,
  selectedClusterId,
  searchQuery,
  loading = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Reset pagination count on search query change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchQuery]);

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <Card className="border-border bg-card/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-indigo-500 animate-pulse" />
            <CardTitle className="text-sm font-semibold tracking-tight animate-pulse">Timeline Visualization</CardTitle>
          </div>
          <CardDescription>Loading topic chronology...</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 overflow-hidden">
            {/* Header skeleton */}
            <div className="flex bg-zinc-950/40 p-3 h-10 items-center">
              <Skeleton className="h-4 w-24" />
              <div className="flex-grow flex justify-between ml-8">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            {/* Row skeletons */}
            {Array.from({ length: 6 }).map((_, i) => {
              const widths = ['45%', '65%', '35%', '80%', '55%', '50%'];
              const offsets = ['10%', '20%', '5%', '15%', '30%', '12%'];
              return (
                <div key={i} className="flex p-3 items-center h-12">
                  <div className="w-[260px] flex-shrink-0 flex items-center justify-between pr-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-8 rounded-full" />
                  </div>
                  <div className="flex-grow pl-4 relative">
                    <Skeleton 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: widths[i % widths.length], 
                        marginLeft: offsets[i % offsets.length] 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Empty State ── */
  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-indigo-500" />
            <CardTitle className="text-sm font-semibold tracking-tight">Timeline Visualization</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Newspaper size={36} strokeWidth={1.5} className="text-zinc-600" />
          <p className="text-sm text-center">
            No topics found. Click the <span className="text-foreground font-medium">Refresh</span> button to ingest news articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 1. Filter by search query
  const filteredData = data.filter((topic) =>
    topic.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Double-sort order:startTime DESC, then articleCount DESC
  const sortedData = [...filteredData].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.articleCount - a.articleCount;
  });

  // Calculate overall date boundaries for the visible/filtered dataset
  const timestamps = sortedData.flatMap((d) => [
    new Date(d.startTime).getTime(),
    new Date(d.endTime).getTime(),
  ]);

  const domainMin = timestamps.length > 0 ? Math.min(...timestamps) : Date.now() - 24 * 60 * 60 * 1000;
  const domainMax = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
  const domainSpan = Math.max(domainMax - domainMin, 24 * 60 * 60 * 1000); // minimum 24 hour span

  // Slice for pagination
  const displayedData = sortedData.slice(0, visibleCount);

  // Build grid ticks
  const ticks: number[] = Array.from({ length: NUM_TICKS }, (_, i) =>
    domainMin + (domainSpan / (NUM_TICKS - 1)) * i
  );

  const getTickAlignmentClass = (index: number, total: number) => {
    if (index === 0) return 'left-0 translate-x-0';
    if (index === total - 1) return 'right-0 translate-x-0';
    return '-translate-x-1/2';
  };

  const rangeLabel = sortedData.length > 0
    ? `${formatDateShort(domainMin)} – ${formatDateShort(domainMax)} · ${sortedData.length} topics shown`
    : 'No topics in date range';

  return (
    <TooltipProvider>
      <Card className="border-border bg-card/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-indigo-500" />
              <CardTitle className="text-sm font-semibold tracking-tight">Timeline Visualization</CardTitle>
            </div>
            <span className="text-xs text-zinc-500 font-medium">{rangeLabel}</span>
          </div>
          <CardDescription className="text-xs">
            Horizontal swimlanes showing duration (length) and volume (opacity & thickness) of active news events.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-4 pt-1">
          <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/20">
            {/* Timeline Header Row (Sticky) */}
            <div className="flex bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-20">
              <div className="w-[260px] flex-shrink-0 pr-4 border-r border-zinc-800 p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider pl-3">
                Topic Category
              </div>
              <div className="flex-grow relative h-10 flex items-center px-4 select-none">
                {ticks.map((ts, i) => {
                  const leftPercent = ((ts - domainMin) / domainSpan) * 100;
                  return (
                    <div
                      key={`tick-${i}`}
                      className={`absolute text-[9px] text-zinc-500 font-mono font-medium ${getTickAlignmentClass(
                        i,
                        ticks.length
                      )}`}
                      style={{
                        left: i === ticks.length - 1 ? 'auto' : `${leftPercent}%`,
                        right: i === ticks.length - 1 ? '16px' : 'auto',
                      }}
                    >
                      {formatDateShort(ts)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid & Swimlanes Container */}
            <div className="relative">
              {/* Background Vertical Grid Lines */}
              <div className="absolute inset-y-0 left-[260px] right-0 pointer-events-none z-0 px-4">
                <div className="relative w-full h-full">
                  {ticks.map((ts, i) => {
                    const leftPercent = ((ts - domainMin) / domainSpan) * 100;
                    return (
                      <div
                        key={`grid-line-${i}`}
                        className="absolute top-0 bottom-0 border-l border-zinc-900 border-dashed"
                        style={{ left: `${leftPercent}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Rows List */}
              <div className="divide-y divide-zinc-900 relative z-10">
                {displayedData.map((topic) => {
                  const startOffset = new Date(topic.startTime).getTime() - domainMin;
                  const duration = new Date(topic.endTime).getTime() - new Date(topic.startTime).getTime();
                  
                  // Calculate absolute percentage bounds
                  const widthPercent = Math.max((duration / domainSpan) * 100, 1.5);
                  const leftPercent = Math.min((startOffset / domainSpan) * 100, 100 - widthPercent);
                  
                  const isSelected = selectedClusterId === topic.id;

                  // Opacity mapping (0.45 to 1.0)
                  const opacity = 0.45 + topic.intensity * 0.55;

                  // Height mapping based on intensity
                  const barHeightClass = topic.intensity > 0.8
                    ? 'h-3'
                    : topic.intensity > 0.4
                    ? 'h-2.5'
                    : 'h-1.5';

                  return (
                    <Tooltip key={topic.id}>
                      <TooltipTrigger
                        render={
                          <div
                            onClick={() => onSelectCluster(topic.id)}
                            className={`group flex items-center cursor-pointer transition-colors duration-150 border-l-2 ${
                              isSelected
                                ? 'bg-zinc-800/35 border-l-indigo-500'
                                : 'hover:bg-zinc-800/15 border-l-transparent'
                            }`}
                          />
                        }
                      >
                        {/* Left Column Label & Badge */}
                        <div className="w-[260px] flex-shrink-0 flex items-center justify-between pr-4 py-2.5 border-r border-zinc-900 pl-3">
                            <span
                              className={`text-xs font-semibold truncate max-w-[190px] transition-colors duration-150 ${
                                isSelected ? 'text-indigo-400' : 'text-zinc-300 group-hover:text-white'
                              }`}
                            >
                              {topic.label}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`font-mono text-[9px] py-0 px-1.5 border transition-colors duration-150 ${
                                isSelected
                                  ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40'
                                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/30'
                              }`}
                            >
                              {topic.articleCount}
                            </Badge>
                          </div>

                          {/* Right Column Track */}
                          <div className="flex-grow relative h-10 flex items-center px-4">
                            <div
                              className={`absolute rounded-full bg-indigo-600 transition-all duration-150 ${barHeightClass} ${
                                isSelected
                                  ? 'ring-1.5 ring-indigo-400 ring-offset-1 ring-offset-zinc-950 opacity-100 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
                                  : 'group-hover:opacity-100 group-hover:bg-indigo-500'
                              }`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                opacity: isSelected ? 1 : opacity,
                              }}
                            />
                          </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        sideOffset={6}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 p-3 rounded-lg shadow-xl max-w-sm space-y-2.5 z-50"
                      >
                        <div>
                          <h4 className="font-semibold text-xs text-white leading-tight">
                            {topic.label}
                          </h4>
                        </div>
                        
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <FileText size={12} className="text-indigo-400 shrink-0" />
                            <span>
                              <strong className="text-zinc-200">{topic.articleCount}</strong> article
                              {topic.articleCount !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {topic.sources && topic.sources.length > 0 && (
                            <div className="flex items-start gap-1.5 text-zinc-400">
                              <Newspaper size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">
                                Sources: <strong className="text-zinc-200">{topic.sources.join(', ')}</strong>
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <CalendarDays size={12} className="text-indigo-400 shrink-0" />
                            <span>
                              Timeline: <strong className="text-zinc-200">{formatDateFull(topic.startTime)}</strong>
                              {topic.startTime !== topic.endTime && (
                                <>
                                  {' '}to <strong className="text-zinc-200">{formatDateFull(topic.endTime)}</strong>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredData.length > visibleCount && (
              <div className="flex justify-center py-3 border-t border-zinc-900 bg-zinc-950/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount((prev) => prev + INITIAL_VISIBLE_COUNT)}
                  className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/40 flex items-center gap-1"
                >
                  <ChevronDown size={14} />
                  Show More ({filteredData.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default Timeline;
