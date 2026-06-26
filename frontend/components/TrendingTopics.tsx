'use client';

import React from 'react';
import { TrendingUp, Calendar, Newspaper, Clock } from 'lucide-react';
import { TimelineData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrendingTopicsProps {
  data: TimelineData[];
  onSelectCluster: (id: number) => void;
  selectedClusterId: number | null;
  searchQuery: string;
}

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr} - ${endStr}`;
}

function calculateDuration(startIso: string, endIso: string): string {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'less than an hour';
  if (diffHours < 24) return `${diffHours}h active`;
  
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d active`;
}

export const TrendingTopics: React.FC<TrendingTopicsProps> = ({
  data,
  onSelectCluster,
  selectedClusterId,
  searchQuery,
}) => {
  // Sort clusters by articleCount descending to find trending
  const sortedData = [...data].sort((a, b) => b.articleCount - a.articleCount);

  // Filter based on search query
  const filteredData = sortedData.filter((topic) =>
    topic.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className="flex flex-col h-[480px]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-primary" />
          <CardTitle className="text-sm font-semibold tracking-tight">Trending News Topics</CardTitle>
        </div>
        <CardDescription>
          Ranked by article volume and chronologically tracked
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0 border-t border-border">
        <CardContent className="p-3 space-y-1">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Newspaper size={24} strokeWidth={1.5} />
              <p className="text-xs">No matching topics found.</p>
            </div>
          ) : (
            filteredData.map((topic, index) => {
              const isSelected = selectedClusterId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectCluster(topic.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-transparent border-transparent hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary/70">
                        #{index + 1}
                      </span>
                      <h4 className="text-xs font-medium truncate text-foreground">
                        {topic.label}
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDateRange(topic.startTime, topic.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {calculateDuration(topic.startTime, topic.endTime)}
                      </span>
                    </div>
                  </div>

                  <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5 shrink-0">
                    {topic.articleCount} articles
                  </Badge>
                </button>
              );
            })
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default TrendingTopics;
