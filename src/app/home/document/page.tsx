"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Firebase setup
import { onAuthStateChanged, User } from 'firebase/auth'; // Type for authenticated user
import { Button } from "@/components/ui/button"; // Bouton

interface Folder {
    id: string;
    name: string;
}

interface Document {
    id: string;
    title: string;
    lastSaved: string;
    folderId?: string | null;
}

const DocumentList: React.FC = () => {
    const [user, setUser] = useState<User | null>(null); // Store the authenticated user
    const [folders, setFolders] = useState<Folder[]>([]); // Store the folders
    const [rootDocuments, setRootDocuments] = useState<Document[]>([]); // Store the documents without folderId
    const [documents, setDocuments] = useState<Document[]>([]); // Store the documents within a folder
    const [currentFolder, setCurrentFolder] = useState<string | null>(null); // Store the current folder ID
    const router = useRouter();

    // Monitor Firebase authentication
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchFoldersAndRootDocuments(currentUser.uid); // Load the folders and root documents for the user
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch folders and root documents (documents without folderId)
    const fetchFoldersAndRootDocuments = async (uid: string) => {
        try {
            // Fetch folders
            const folderSnapshot = await getDocs(collection(db, `users/${uid}/folders`));
            const fetchedFolders: Folder[] = folderSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || 'Unnamed Folder',
            }));
            setFolders(fetchedFolders);

            // Fetch documents without folderId (root documents)
            const docSnapshot = await getDocs(collection(db, `users/${uid}/documents`));
            const rootDocs: Document[] = docSnapshot.docs
                .filter(doc => !doc.data().folderId) // Filter documents without folderId
                .map(doc => ({
                    id: doc.id,
                    title: doc.data().title || 'Untitled Document',
                    lastSaved: doc.data().lastSaved || new Date().toISOString(),
                    folderId: doc.data().folderId || null
                }));
            setRootDocuments(rootDocs);
        } catch (error) {
            console.error('Error fetching folders and documents:', error);
        }
    };

    // Fetch documents inside a folder
    const fetchDocuments = async (uid: string, folderId: string | null) => {
        try {
            const querySnapshot = await getDocs(collection(db, `users/${uid}/documents`));
            const docs: Document[] = querySnapshot.docs
                .filter(doc => doc.data().folderId === folderId) // Filter documents by the selected folder
                .map(doc => ({
                    id: doc.id,
                    title: doc.data().title || 'Untitled Document',
                    lastSaved: doc.data().lastSaved || new Date().toISOString(),
                }));
            setDocuments(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    // Create a new document (in the current folder or in the root)
    const createNewDocument = async () => {
        if (user) {
            try {
                const docRef = await addDoc(collection(db, `users/${user.uid}/documents`), {
                    title: 'New Document',
                    content: '',
                    lastSaved: new Date().toISOString(),
                    folderId: currentFolder, // If currentFolder is null, document will be at root
                });
                router.push(`/home/document/${docRef.id}`); // Navigate to the document editor
            } catch (error) {
                console.error('Error creating document:', error);
            }
        }
    };

    // Open an existing document
    const openDocument = (docId: string) => {
        router.push(`/home/document/${docId}`); // Navigate to the document editor
    };

    // Open a folder and load its documents
    const openFolder = (folderId: string) => {
        setCurrentFolder(folderId); // Set the current folder ID
        if (user) {
            fetchDocuments(user.uid, folderId); // Load documents in this folder
        }
    };

    // Return to the folder view (list of folders and root documents)
    const goBackToFolders = () => {
        setCurrentFolder(null);
        setDocuments([]); // Reset the document list
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">
                {currentFolder ? 'Documents in Folder' : 'Your Folders and Documents'}
            </h1>

            {currentFolder ? (
                <>
                    <Button onClick={goBackToFolders} className="mb-4">
                        Back to Folders
                    </Button>
                    <Button onClick={createNewDocument} className="mb-4">
                        Create a New Document in this Folder
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.length > 0 ? (
                            documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-4 border rounded-md shadow cursor-pointer hover:bg-gray-100"
                                    onClick={() => openDocument(doc.id)}
                                >
                                    <h3 className="text-lg font-semibold">{doc.title}</h3>
                                    <p className="text-sm text-gray-500">Last modified: {new Date(doc.lastSaved).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No documents in this folder.</p>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <Button onClick={createNewDocument} className="mb-4">
                        Create a New Document
                    </Button>

                    <h2 className="text-xl font-semibold mb-4">Root Documents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {rootDocuments.length > 0 ? (
                            rootDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-4 border rounded-md shadow cursor-pointer hover:bg-gray-100"
                                    onClick={() => openDocument(doc.id)}
                                >
                                    <h3 className="text-lg font-semibold">{doc.title}</h3>
                                    <p className="text-sm text-gray-500">Last modified: {new Date(doc.lastSaved).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No documents at the root.</p>
                        )}
                    </div>

                    <h2 className="text-xl font-semibold mb-4">Folders</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {folders.length > 0 ? (
                            folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="p-4 border rounded-md shadow cursor-pointer hover:bg-gray-100"
                                    onClick={() => openFolder(folder.id)}
                                >
                                    <h3 className="text-lg font-semibold">{folder.name}</h3>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No folders available.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DocumentList;