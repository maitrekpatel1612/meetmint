"use client";

import { useState } from "react";
import { useParticipants } from "@/hooks/useParticipants";
import { useSlots } from "@/hooks/useSlots";
import { useParticipantStore } from "@/store/participantStore";
import { ParticipantCard } from "@/components/ParticipantCard";
import { AddParticipantDialog } from "@/components/AddParticipantDialog";
import { BusyBlockDialog } from "@/components/BusyBlockDialog";
import { SlotSearchForm } from "@/components/SlotSearchForm";
import { SlotResultCard } from "@/components/SlotResultCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    CalendarClock,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Users,
} from "lucide-react";
import { SlotSearchResult } from "@/lib/types";

export default function DashboardPage() {
    const { data: participants = [], isLoading: loadingParticipants } =
        useParticipants();
    const { setAddDialogOpen } = useParticipantStore();
    const [searchResult, setSearchResult] = useState<SlotSearchResult | null>(
        null,
    );

    const handleSearchResults = (data?: SlotSearchResult) => {
        setSearchResult(data ?? null);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        <h1 className="font-bold text-lg tracking-tight">
                            MeetMint
                        </h1>
                        <Badge
                            variant="secondary"
                            className="text-xs hidden sm:inline-flex"
                        >
                            Meeting Scheduler
                        </Badge>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setAddDialogOpen(true)}
                        className="gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Add Participant
                    </Button>
                </div>
            </header>

            {/* ── Main layout ─────────────────────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* ── LEFT: Participants ───────────────────────────────────────── */}
                <aside className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Participants
                        </h2>
                        {participants.length > 0 && (
                            <Badge
                                variant="outline"
                                className="text-xs ml-auto"
                            >
                                {participants.length}
                            </Badge>
                        )}
                    </div>

                    {loadingParticipants ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Loading…
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">
                                No participants yet.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAddDialogOpen(true)}
                            >
                                <Plus className="h-3 w-3 mr-1" /> Add your first
                                participant
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-10rem)]">
                            <div className="space-y-3 pr-3">
                                {participants.map((p) => (
                                    <ParticipantCard
                                        key={p._id}
                                        participant={p}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </aside>

                {/* ── RIGHT: Search + Results ──────────────────────────────────── */}
                <section className="space-y-6">
                    {/* Search form */}
                    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Find a Meeting Slot
                            </h2>
                        </div>
                        <Separator />
                        <SlotSearchForm onResults={handleSearchResults} />
                    </div>

                    {/* Results */}
                    {searchResult && (
                        <div className="space-y-3">
                            {/* Summary banner */}
                            <div
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
                                    searchResult.noFullOverlap
                                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                                        : "bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400"
                                }`}
                            >
                                {searchResult.noFullOverlap ? (
                                    <>
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>
                                            No full-group overlap found. Showing
                                            best partial matches (
                                            {
                                                searchResult.totalCandidatesEvaluated
                                            }{" "}
                                            windows evaluated, strategy:{" "}
                                            <strong>
                                                {searchResult.strategy}
                                            </strong>
                                            ).
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                        <span>
                                            Full overlap found!{" "}
                                            {searchResult.slots.length} slot
                                            {searchResult.slots.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                            available.
                                        </span>
                                    </>
                                )}
                            </div>

                            {searchResult.slots.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm space-y-1">
                                    <p className="font-medium">
                                        No slots found
                                    </p>
                                    <p>
                                        Try widening the date range or reducing
                                        the duration.
                                    </p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[calc(100vh-28rem)]">
                                    <div className="space-y-3 pr-3">
                                        {searchResult.slots.map((slot, i) => (
                                            <SlotResultCard
                                                key={slot.startUtc}
                                                slot={slot}
                                                rank={i + 1}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* ── Dialogs ─────────────────────────────────────────────────────── */}
            <AddParticipantDialog />
            <BusyBlockDialog />
        </div>
    );
}
