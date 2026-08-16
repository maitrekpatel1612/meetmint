"use client";

import { useSearchStore } from "@/store/searchStore";
import { useSlots } from "@/hooks/useSlots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { SlotSearchResult, StrategyName } from "@/lib/types";

const STRATEGIES: {
    value: StrategyName;
    label: string;
    description: string;
}[] = [
    {
        value: "attendance",
        label: "👥 Attendance",
        description: "Maximize participants",
    },
    {
        value: "convenience",
        label: "☀️ Convenience",
        description: "Prefer business hours",
    },
    {
        value: "fairness",
        label: "⚖️ Fairness",
        description: "Equal inconvenience",
    },
    { value: "hybrid", label: "🔀 Hybrid", description: "Blended scoring" },
];

interface SlotSearchFormProps {
    onResults: (data?: SlotSearchResult) => void;
}

export function SlotSearchForm({ onResults }: SlotSearchFormProps) {
    const { searchParams, setSearchParams, resetSearchParams } =
        useSearchStore();
    const { mutate: findSlots, isPending } = useSlots();

    function handleSearch() {
        findSlots(searchParams, {
            onSuccess: (data) => onResults(data),
        });
    }

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label
                        htmlFor="dateRangeStart"
                        className="mb-1 block text-sm font-medium text-white"
                    >
                        From
                    </Label>
                    <Input
                        id="dateRangeStart"
                        type="date"
                        value={searchParams.dateRangeStart}
                        onChange={(e) =>
                            setSearchParams({ dateRangeStart: e.target.value })
                        }
                        className="h-11 rounded-xl border border-white/10 bg-[#2a2c31] px-3 text-base text-white shadow-inner shadow-black/10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="dateRangeEnd"
                        className="mb-1 block text-sm font-medium text-white"
                    >
                        To
                    </Label>
                    <Input
                        id="dateRangeEnd"
                        type="date"
                        value={searchParams.dateRangeEnd}
                        onChange={(e) =>
                            setSearchParams({ dateRangeEnd: e.target.value })
                        }
                        className="h-11 rounded-xl border border-white/10 bg-[#2a2c31] px-3 text-base text-white shadow-inner shadow-black/10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label
                        htmlFor="duration"
                        className="mb-1 block text-sm font-medium text-white"
                    >
                        Duration (min)
                    </Label>
                    <Input
                        id="duration"
                        type="number"
                        min={15}
                        max={480}
                        step={15}
                        value={searchParams.durationMinutes}
                        onChange={(e) =>
                            setSearchParams({
                                durationMinutes: Number(e.target.value),
                            })
                        }
                        className="h-11 rounded-xl border border-white/10 bg-[#2a2c31] px-3 text-base text-white shadow-inner shadow-black/10"
                    />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="granularity"
                        className="mb-1 block text-sm font-medium text-white"
                    >
                        Step size (min)
                    </Label>
                    <Select
                        value={String(searchParams.granularityMinutes)}
                        onValueChange={(v) =>
                            setSearchParams({
                                granularityMinutes: Number(v) as 5 | 15 | 30,
                            })
                        }
                    >
                        <SelectTrigger
                            id="granularity"
                            className="h-11 w-full rounded-xl border border-white/10 bg-[#2a2c31] px-3 text-base text-white shadow-inner shadow-black/10 data-placeholder:text-white/70"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 min</SelectItem>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label
                    htmlFor="strategy"
                    className="mb-1 block text-sm font-medium text-white"
                >
                    Ranking strategy
                </Label>
                <Select
                    value={searchParams.strategy}
                    onValueChange={(v) =>
                        setSearchParams({ strategy: v as StrategyName })
                    }
                >
                    <SelectTrigger
                        id="strategy"
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#2a2c31] px-3 text-base text-white shadow-inner shadow-black/10 data-placeholder:text-white/70"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STRATEGIES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                <span>{s.label}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {s.description}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex gap-2 pt-1">
                <Button
                    onClick={handleSearch}
                    disabled={isPending}
                    className="flex-1 gap-2 rounded-xl bg-[#f1f1f1] text-[#111827] hover:bg-white"
                >
                    <Search className="h-4 w-4" />
                    {isPending ? "Searching…" : "Find Slots"}
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={resetSearchParams}
                    title="Reset to defaults"
                    className="h-11 w-11 rounded-xl border border-white/10 bg-transparent text-white hover:bg-white/5"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
