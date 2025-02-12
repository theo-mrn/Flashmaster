"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NoteFolder {
    id: string;
    name: string;
}

interface SaveDialogProps {
    id?: string;
    user: User | null;
    onSave: (title: string, folderId: string | null) => Promise<void>;
    currentTitle?: string;
}

export function SaveDialog({ id, user, onSave, currentTitle = 'Document sans titre' }: SaveDialogProps) {
    const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(() => {
        if (user && isOpen) {
            const fetchNoteFolders = async () => {
                try {
                    const folderCollection = collection(db, `users/${user.uid}/notefolders`);
                    const folderSnapshot = await getDocs(folderCollection);
                    const folderList: NoteFolder[] = folderSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name || 'Dossier sans nom',
                    }));
                    setNoteFolders(folderList);
                } catch (error) {
                    console.error("Erreur lors de la récupération des dossiers:", error);
                }
            };
            fetchNoteFolders();
        }
    }, [user, isOpen]);

    const handleSave = async () => {
        // Convertir "null" en null réel
        const actualFolderId = selectedFolder === "null" ? null : selectedFolder;
        await onSave(currentTitle, actualFolderId);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger id={id} className="hidden" />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Déplacer le document</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                    <Select onValueChange={setSelectedFolder}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un dossier" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Aucun dossier (racine)</SelectItem>
                            {noteFolders.map((folder) => (
                                <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSave}>Déplacer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
