'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddBusyBlock } from '@/hooks/useParticipants';
import { useParticipantStore } from '@/store/participantStore';
import { busyBlockSchema, BusyBlockInput } from '@/lib/types';

export function BusyBlockDialog() {
  const { selectedParticipant, isBusyDialogOpen, setBusyDialogOpen } = useParticipantStore();
  const { mutate: addBusyBlock, isPending } = useAddBusyBlock();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BusyBlockInput>({
    resolver: zodResolver(busyBlockSchema),
  });

  function onSubmit(data: BusyBlockInput) {
    if (!selectedParticipant) return;
    addBusyBlock(
      { participantId: selectedParticipant._id, data },
      { onSuccess: () => { reset(); setBusyDialogOpen(false); } }
    );
  }

  return (
    <Dialog open={isBusyDialogOpen} onOpenChange={setBusyDialogOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Add Busy Block — {selectedParticipant?.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="busy-date">Date</Label>
            <Input id="busy-date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="busy-start">From (local)</Label>
              <Input id="busy-start" type="time" {...register('start')} />
              {errors.start && <p className="text-xs text-destructive">{errors.start.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="busy-end">Until (local)</Label>
              <Input id="busy-end" type="time" {...register('end')} />
              {errors.end && <p className="text-xs text-destructive">{errors.end.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="busy-label">Label (optional)</Label>
            <Input id="busy-label" placeholder="Team standup" {...register('label')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBusyDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding…' : 'Add Block'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
