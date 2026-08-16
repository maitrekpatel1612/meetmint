"use client";

import { Participant } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock3, MapPin, Trash2, Plus, X, CalendarRange } from "lucide-react";
import {
    useRemoveParticipant,
    useRemoveBusyBlock,
} from "@/hooks/useParticipants";
import { useParticipantStore } from "@/store/participantStore";

interface ParticipantCardProps {
    participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
    const { mutate: removeParticipant } = useRemoveParticipant();
    const { mutate: removeBusyBlock } = useRemoveBusyBlock();
    const { setSelectedParticipant, setBusyDialogOpen } = useParticipantStore();

    function handleAddBusy() {
        setSelectedParticipant(participant);
        setBusyDialogOpen(true);
    }

    return (
        <Card className="group overflow-hidden border border-border/60 bg-card/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-[0_18px_40px_-24px_rgba(124,58,237,0.65)] dark:hover:border-violet-500/40">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 via-indigo-500/15 to-sky-500/10 text-primary ring-1 ring-primary/10">
                        <span className="text-sm font-semibold">
                            {participant.name.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold tracking-tight">
                            {participant.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                                {participant.timezone}
                            </span>
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeParticipant(participant._id)}
                    aria-label={`Remove ${participant.name}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-3 p-4 pt-0">
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        Availability
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <span>{participant.availableStart}</span>
                        <span className="text-muted-foreground">–</span>
                        <span>{participant.availableEnd}</span>
                        <span className="text-muted-foreground">local</span>
                    </p>
                </div>

                {participant.busyBlocks.length > 0 && (
                    <>
                        <Separator className="bg-border/60" />
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                <CalendarRange className="h-3.5 w-3.5" />
                                Busy blocks
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {participant.busyBlocks.map((block) => (
                                    <Badge
                                        key={block._id}
                                        variant="secondary"
                                        className="group/badge flex items-center gap-1.5 rounded-full border border-border/60 bg-slate-100/80 px-2.5 py-1 text-[11px] text-slate-700 shadow-sm dark:bg-slate-800/70 dark:text-slate-200"
                                    >
                                        <span className="font-medium">
                                            {block.date}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {block.start}–{block.end}
                                        </span>
                                        {block.label && (
                                            <span className="text-muted-foreground">
                                                · {block.label}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() =>
                                                removeBusyBlock({
                                                    participantId:
                                                        participant._id,
                                                    blockId: block._id,
                                                })
                                            }
                                            aria-label="Remove busy block"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-center rounded-xl border border-dashed border-border/80 bg-transparent text-xs font-medium text-muted-foreground transition hover:border-violet-300 hover:bg-violet-500/5 hover:text-foreground"
                    onClick={handleAddBusy}
                >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add busy block
                </Button>
            </CardContent>
        </Card>
    );
}
