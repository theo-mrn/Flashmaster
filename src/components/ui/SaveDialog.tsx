"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase'; // Your Firebase setup
import { collection, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth'; // Import Firebase User type

// Define the folder interface to type the folders fetched from Firebase
interface Folder {
    id: string;
    name: string;
}

interface SaveDialogProps {
    user: User | null; // Authenticated user, or null if not signed in
    onSave: (title: string, folderId: string | null) => Promise<void>; // Callback to save the document
}

const SaveDialog: React.FC<SaveDialogProps> = ({ user, onSave }) => {
    const [folders, setFolders] = useState<Folder[]>([]); // Store folder list
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // Selected folder
    const [docTitle, setDocTitle] = useState<string>(''); // Document title
    const [isOpen, setIsOpen] = useState<boolean>(false); // Control dialog open/close

    // Fetch folders from Firebase when dialog opens
    useEffect(() => {
        if (user && isOpen) {
            const fetchFolders = async () => {
                try {
                    const folderCollection = collection(db, `users/${user.uid}/folders`);
                    const folderSnapshot = await getDocs(folderCollection);
                    const folderList: Folder[] = folderSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name || 'Unnamed Folder',
                    }));
                    setFolders(folderList);
                } catch (error) {
                    console.error("Error fetching folders:", error);
                }
            };
            fetchFolders();
        }
    }, [user, isOpen]);

    // Handle save action
    const handleSave = async () => {
        if (docTitle) {
            await onSave(docTitle, selectedFolder); // Save the document
            setIsOpen(false); // Close the dialog
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Enregistrer</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sauvegarder le document</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                    <input
                        className="border p-2"
                        type="text"
                        placeholder="Nom du document"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                    />
                    <select
                        className="border p-2"
                        value={selectedFolder || ''}
                        onChange={(e) => setSelectedFolder(e.target.value || null)}
                    >
                        <option value="">Sélectionner un dossier</option>
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSave}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SaveDialog;