"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddParticipant } from "@/hooks/useParticipants";
import { useParticipantStore } from "@/store/participantStore";
import { createParticipantSchema, CreateParticipantInput } from "@/lib/types";

// Common IANA timezones for the select
const TIMEZONES = [
    "Asia/Kolkata",
    "Europe/London",
    "America/Los_Angeles",
    "America/New_York",
    "America/Chicago",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
    "Pacific/Auckland",
    "UTC",
];

export function AddParticipantDialog() {
    const { isAddDialogOpen, setAddDialogOpen } = useParticipantStore();
    const { mutate: addParticipant, isPending } = useAddParticipant();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateParticipantInput>({
        resolver: zodResolver(createParticipantSchema),
        defaultValues: {
            availableStart: "09:00",
            availableEnd: "18:00",
            timezone: "UTC",
        },
    });

    function onSubmit(data: CreateParticipantInput) {
        addParticipant(data, {
            onSuccess: () => {
                reset();
                setAddDialogOpen(false);
            },
        });
    }

    return (
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Participant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="Maya"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                            id="timezone"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...register("timezone")}
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                        {errors.timezone && (
                            <p className="text-xs text-destructive">
                                {errors.timezone.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="availableStart">
                                Available from
                            </Label>
                            <Input
                                id="availableStart"
                                type="time"
                                {...register("availableStart")}
                                className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                            />
                            {errors.availableStart && (
                                <p className="text-xs text-destructive">
                                    {errors.availableStart.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="availableEnd">
                                Available until
                            </Label>
                            <Input
                                id="availableEnd"
                                type="time"
                                {...register("availableEnd")}
                                className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                            />
                            {errors.availableEnd && (
                                <p className="text-xs text-destructive">
                                    {errors.availableEnd.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Adding…" : "Add Participant"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
