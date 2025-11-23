import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { Partecipante } from "@/types/courseData";

interface ParticipantReorderProps {
    participants: Partecipante[];
    onReorder: (newOrder: Partecipante[]) => void;
}

export const ParticipantReorder = ({ participants, onReorder }: ParticipantReorderProps) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setDraggedIndex(index);
        // Set drag effect
        e.dataTransfer.effectAllowed = "move";
        // Create a ghost image if needed, but default is usually fine
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const copyListItems = [...participants];
            const dragItemContent = copyListItems[dragItem.current];
            copyListItems.splice(dragItem.current, 1);
            copyListItems.splice(dragOverItem.current, 0, dragItemContent);
            dragItem.current = null;
            dragOverItem.current = null;
            setDraggedIndex(null);
            onReorder(copyListItems);
        } else {
            setDraggedIndex(null);
        }
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === participants.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const copyListItems = [...participants];
        const item = copyListItems[index];
        copyListItems.splice(index, 1);
        copyListItems.splice(newIndex, 0, item);
        onReorder(copyListItems);
    };

    return (
        <AccordionItem value="participants-reorder" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">👥 Ordina Partecipanti</span>
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({participants.length} partecipanti)
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
                <CardDescription className="mb-4">
                    Trascina i partecipanti per modificare l'ordine che apparirà nei documenti generati.
                    I placeholder <code>{`{{PARTECIPANTE 1}}`}</code>, <code>{`{{PARTECIPANTE 2}}`}</code> seguiranno questo ordine.
                </CardDescription>

                <div className="space-y-2">
                    {participants.map((participant, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`
                                flex items-center justify-between p-3 rounded-lg border bg-card
                                ${draggedIndex === index ? 'opacity-50 border-dashed border-primary' : 'hover:border-primary/50'}
                                transition-all cursor-move
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1 rounded hover:bg-accent text-muted-foreground">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {index + 1}. {participant.nome_completo}
                                    </span>
                                    {participant.ruolo && (
                                        <span className="text-xs text-muted-foreground">
                                            {participant.ruolo}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={index === 0}
                                    onClick={() => moveItem(index, 'up')}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={index === participants.length - 1}
                                    onClick={() => moveItem(index, 'down')}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
