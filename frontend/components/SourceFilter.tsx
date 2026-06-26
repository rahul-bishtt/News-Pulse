'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SourceFilterProps {
  sources: string[];
  selectedSources: string[];
  onChange: (sources: string[]) => void;
}

export const SourceFilter: React.FC<SourceFilterProps> = ({
  sources,
  selectedSources,
  onChange,
}) => {
  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      onChange(selectedSources.filter((s) => s !== source));
    } else {
      onChange([...selectedSources, source]);
    }
  };

  const activeCount = selectedSources.length;

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter size={13} className="text-muted-foreground" />
            Sources
          </div>
          {activeCount > 0 && sources.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {activeCount} of {sources.length} active
            </span>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3 pb-4 px-4">
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Select a topic to filter by source.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* "All" pill */}
            <Button
              variant={activeCount === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange([])}
              className="h-7 px-3 text-xs rounded-full"
            >
              All
            </Button>
            {sources.map((source) => {
              const isActive = selectedSources.includes(source);
              return (
                <Button
                  key={source}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSource(source)}
                  className="h-7 px-3 text-xs rounded-full transition-all duration-150"
                >
                  {source}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SourceFilter;
