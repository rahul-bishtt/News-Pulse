'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import Timeline from '@/components/Timeline';
import ClusterDetail from '@/components/ClusterDetail';
import SourceFilter from '@/components/SourceFilter';
import RefreshButton from '@/components/RefreshButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getTimeline, TimelineData } from '@/lib/api';

export default function Home() {
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * background=true → preserve existing data on screen until fetch completes (used by Refresh).
   * background=false → show skeleton on initial mount only.
   */
  const loadDashboardData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const data = await getTimeline();
      setTimelineData(data);
    } catch {
      setError('Unable to reach the backend API. Make sure the server is running on port 4000.');
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  const handleSelectCluster = (id: number) => {
    setSelectedClusterId(id);
    setSelectedSources([]);
    setAvailableSources([]);
  };

  const handleSourcesDiscovered = (sources: string[]) => {
    setAvailableSources(sources);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Activity size={18} className="text-primary" />
            <span className="font-semibold text-sm tracking-tight">News Pulse</span>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Topic-clustered news analytics
            </span>
          </div>
          <RefreshButton onComplete={() => loadDashboardData(true)} />
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle size={15} />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Timeline + Source filter */}
          <div className="lg:col-span-2 space-y-4">
            <Timeline
              data={timelineData}
              onSelectCluster={handleSelectCluster}
              selectedClusterId={selectedClusterId}
              loading={loading}
            />
            <SourceFilter
              sources={availableSources}
              selectedSources={selectedSources}
              onChange={setSelectedSources}
            />
          </div>

          {/* Right column: Cluster detail */}
          <div className="lg:col-span-1">
            <ClusterDetail
              clusterId={selectedClusterId}
              selectedSources={selectedSources}
              onSourcesDiscovered={handleSourcesDiscovered}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
