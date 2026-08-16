'use client';

import { useSearchStore } from '@/store/searchStore';
import { useSlots } from '@/hooks/useSlots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';
import { StrategyName } from '@/lib/types';

const STRATEGIES: { value: StrategyName; label: string; description: string }[] = [
  { value: 'attendance',  label: '👥 Attendance',  description: 'Maximize participants' },
  { value: 'convenience', label: '☀️ Convenience', description: 'Prefer business hours' },
  { value: 'fairness',    label: '⚖️ Fairness',    description: 'Equal inconvenience' },
  { value: 'hybrid',      label: '🔀 Hybrid',      description: 'Blended scoring' },
];

interface SlotSearchFormProps {
  onResults: (data: ReturnType<typeof useSlots>['data']) => void;
}

export function SlotSearchForm({ onResults }: SlotSearchFormProps) {
  const { searchParams, setSearchParams, resetSearchParams } = useSearchStore();
  const { mutate: findSlots, isPending } = useSlots();

  function handleSearch() {
    findSlots(searchParams, { onSuccess: onResults });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="dateRangeStart">From</Label>
          <Input
            id="dateRangeStart"
            type="date"
            value={searchParams.dateRangeStart}
            onChange={e => setSearchParams({ dateRangeStart: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateRangeEnd">To</Label>
          <Input
            id="dateRangeEnd"
            type="date"
            value={searchParams.dateRangeEnd}
            onChange={e => setSearchParams({ dateRangeEnd: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="duration">Duration (min)</Label>
          <Input
            id="duration"
            type="number"
            min={15}
            max={480}
            step={15}
            value={searchParams.durationMinutes}
            onChange={e => setSearchParams({ durationMinutes: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="granularity">Step size (min)</Label>
          <Select
            value={String(searchParams.granularityMinutes)}
            onValueChange={v => setSearchParams({ granularityMinutes: Number(v) as 5 | 15 | 30 })}
          >
            <SelectTrigger id="granularity"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 min</SelectItem>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="strategy">Ranking strategy</Label>
        <Select
          value={searchParams.strategy}
          onValueChange={v => setSearchParams({ strategy: v as StrategyName })}
        >
          <SelectTrigger id="strategy"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STRATEGIES.map(s => (
              <SelectItem key={s.value} value={s.value}>
                <span>{s.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={isPending} className="flex-1 gap-2">
          <Search className="h-4 w-4" />
          {isPending ? 'Searching…' : 'Find Slots'}
        </Button>
        <Button variant="outline" size="icon" onClick={resetSearchParams} title="Reset to defaults">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
