'use client';

import { Slot } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertTriangle, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlotResultCardProps {
  slot: Slot;
  rank: number;
}

export function SlotResultCard({ slot, rank }: SlotResultCardProps) {
  const isFullOverlap = slot.availableCount === slot.totalCount;
  const coveragePercent = Math.round((slot.availableCount / slot.totalCount) * 100);

  const startDate = new Date(slot.startUtc).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <Card className={cn(
      'transition-all',
      isFullOverlap
        ? 'border-green-500/40 bg-green-500/5'
        : 'border-amber-500/30 bg-amber-500/5'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFullOverlap ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span className="font-semibold text-sm">{startDate}</span>
            <Badge variant={isFullOverlap ? 'default' : 'secondary'} className="text-xs">
              {slot.availableCount}/{slot.totalCount} available
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            #{rank}
          </span>
        </div>

        {/* Coverage bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div
            className={cn('h-1.5 rounded-full transition-all', isFullOverlap ? 'bg-green-500' : 'bg-amber-500')}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>

        {slot.unavailable.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Unavailable: <span className="text-amber-500 font-medium">{slot.unavailable.join(', ')}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-1.5">
        <Separator />
        <div className="space-y-1 pt-1">
          {slot.localTimes.map(lt => (
            <div
              key={lt.name}
              className={cn(
                'flex items-center justify-between text-sm py-0.5 px-1 rounded',
                !lt.isAvailable && 'opacity-40 line-through'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('font-medium w-14', lt.isAvailable ? 'text-foreground' : 'text-muted-foreground')}>
                  {lt.name}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-2.5 w-2.5" />
                  {lt.timezone.split('/').pop()?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{lt.date}</span>
                <span className="text-muted-foreground">·</span>
                <span className={lt.isAvailable ? 'text-foreground' : 'text-muted-foreground'}>
                  {lt.start}–{lt.end}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
