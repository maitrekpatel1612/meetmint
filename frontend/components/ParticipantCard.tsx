'use client';

import { Participant } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Trash2, Plus, X } from 'lucide-react';
import { useRemoveParticipant, useRemoveBusyBlock } from '@/hooks/useParticipants';
import { useParticipantStore } from '@/store/participantStore';

interface ParticipantCardProps {
  participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
  const { mutate: removeParticipant } = useRemoveParticipant();
  const { mutate: removeBusyBlock }   = useRemoveBusyBlock();
  const { setSelectedParticipant, setBusyDialogOpen } = useParticipantStore();

  function handleAddBusy() {
    setSelectedParticipant(participant);
    setBusyDialogOpen(true);
  }

  return (
    <Card className="group transition-all hover:shadow-md hover:border-primary/40">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <h3 className="font-semibold text-base">{participant.name}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3" />
            {participant.timezone}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={() => removeParticipant(participant._id)}
          aria-label={`Remove ${participant.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {participant.availableStart} – {participant.availableEnd} local
        </p>

        {participant.busyBlocks.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Busy blocks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {participant.busyBlocks.map(block => (
                  <Badge
                    key={block._id}
                    variant="secondary"
                    className="text-xs gap-1 pr-1 cursor-default"
                  >
                    {block.date} {block.start}–{block.end}
                    {block.label && ` · ${block.label}`}
                    <button
                      className="ml-0.5 hover:text-destructive"
                      onClick={() => removeBusyBlock({ participantId: participant._id, blockId: block._id })}
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
          className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleAddBusy}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add busy block
        </Button>
      </CardContent>
    </Card>
  );
}
