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
    <Card className="flex flex-col h-[540px] border-[#27272A] bg-[#18181B] rounded-xl shadow-lg">
      <CardHeader className="p-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-[#4F46E5]" />
          <CardTitle className="text-base font-bold tracking-tight text-[#FAFAFA]">Trending News Topics</CardTitle>
        </div>
        <CardDescription className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Ranked by article volume and chronologically tracked
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0 border-t border-[#27272A]">
        <CardContent className="p-5 space-y-3.5">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <Newspaper size={28} className="text-zinc-600" strokeWidth={1.5} />
              <p className="text-xs">No matching topics found.</p>
            </div>
          ) : (
            filteredData.map((topic, index) => {
              const isSelected = selectedClusterId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectCluster(topic.id)}
                  className={`w-full text-left p-4.5 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#4F46E5]/10 border-[#4F46E5] text-[#FAFAFA] shadow-md shadow-[#4F46E5]/5'
                      : 'bg-transparent border-transparent hover:border-[#27272A] hover:bg-[#27272A]/10 text-muted-foreground hover:text-[#FAFAFA]'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm md:text-base font-extrabold ${isSelected ? 'text-[#818CF8]' : 'text-[#4F46E5]'}`}>
                        #{index + 1}
                      </span>
                      <h4 className="text-sm md:text-base font-bold truncate text-[#FAFAFA]">
                        {topic.label}
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-3.5 text-[13px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-[#4F46E5]/70 shrink-0" />
                        {formatDateRange(topic.startTime, topic.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-[#4F46E5]/70 shrink-0" />
                        {calculateDuration(topic.startTime, topic.endTime)}
                      </span>
                    </div>
                  </div>

                  <Badge 
                    className={`text-xs font-bold px-2.5 py-1 shrink-0 rounded-md tracking-wider uppercase ${
                      isSelected 
                        ? 'bg-[#4F46E5] text-[#FAFAFA] hover:bg-[#4F46E5]' 
                        : 'bg-[#27272A] text-zinc-300 border border-[#27272A]/50 hover:bg-[#27272A]'
                    }`}
                  >
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
