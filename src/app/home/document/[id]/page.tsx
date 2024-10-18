"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Navigation Next.js 13+
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Firebase setup
import { onAuthStateChanged, User } from 'firebase/auth'; // Firebase User type
import { Bold, Italic, Underline, List, ListOrdered, Type, Palette, Highlighter, Image } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Bouton
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import SaveDialog from '@/components/ui/SaveDialog'; // Importer le SaveDialog

const textColors = ['black', 'red', 'blue', 'green', 'purple', 'orange'];
const highlightColors = ['yellow', 'lime', 'cyan', 'pink', 'lavender', 'orange'];

const DocumentEditor: React.FC = () => {
    const router = useRouter();
    const { id } = useParams(); // Récupérer l'ID du document depuis l'URL
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Référence pour l'input d'images
    const [user, setUser] = useState<User | null>(null); // Stocker l'utilisateur
    const [title, setTitle] = useState<string>('Document sans titre');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [content, setContent] = useState<string>(''); // Contenu du document



    // Charger le document depuis Firebase
    const fetchDocument = useCallback(async (uid: string) => { // Make fetchDocument a dependency-safe function
        if (id) {
            try {
                const docRef = doc(db, `users/${uid}/documents`, id as string);
                const docSnapshot = await getDoc(docRef);

                if (docSnapshot.exists()) {
                    const docData = docSnapshot.data();
                    setTitle(docData.title || 'Sans titre');
                    setContent(docData.content || '');
                    setLastSaved(docData.lastSaved || null);
                } else {
                    console.log("Document non trouvé.");
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du document :', error);
            }
        }
    }, [id]);

        // Surveiller l'authentification Firebase
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    fetchDocument(currentUser.uid); // Charger le document une fois l'utilisateur connecté
                } else {
                    setUser(null);
                    router.push('/'); // Rediriger si l'utilisateur n'est pas connecté
                }
            });
            return () => unsubscribe();
        }, [id, router, fetchDocument]); 


    // Sauvegarder ou créer un nouveau document
    const saveDocument = async (docTitle: string, selectedFolderId: string | null) => {
        if (editorRef.current && user) {
            const updatedContent = editorRef.current.innerHTML;
            try {
                const docRef = id
                    ? doc(db, `users/${user.uid}/documents`, id as string) // Mettre à jour un document existant
                    : await addDoc(collection(db, `users/${user.uid}/documents`), { title: docTitle, content: updatedContent, folderId: selectedFolderId });

                if (id) {
                    await setDoc(docRef, {
                        title: docTitle,
                        content: updatedContent,
                        lastSaved: new Date().toISOString(),
                        folderId: selectedFolderId, // Ajouter ou mettre à jour l'emplacement du document
                    });
                }

                setLastSaved(new Date().toLocaleTimeString());
                console.log('Document sauvegardé avec succès.');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du document :', error);
            }
        }
    };
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            try {
                const storage = getStorage();
                const storageRef = ref(storage, `users/${user.uid}/images/${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
    
                if (editorRef.current) {
                    const imgContainer = document.createElement("div");
                    imgContainer.classList.add("image-container");
                    imgContainer.setAttribute("contenteditable", "false");
                    imgContainer.setAttribute("draggable", "true");
                    imgContainer.style.position = "relative";
                    imgContainer.style.display = "inline-block";
    
                    const imgElement = document.createElement("img");
                    imgElement.src = downloadURL;
                    imgElement.alt = ' image'; // Ensure the alt attribute is correctly set
                    imgElement.style.maxWidth = "100%";
                    imgElement.style.display = "block";
                    imgElement.style.resize = "both";
                    imgElement.style.overflow = "auto";
    
                    const deleteButton = document.createElement("button");
                    deleteButton.classList.add("delete-image");
                    deleteButton.style.position = "absolute";
                    deleteButton.style.top = "0";
                    deleteButton.style.right = "0";
                    deleteButton.style.backgroundColor = "red";
                    deleteButton.style.color = "white";
                    deleteButton.textContent = "X";
    
                    imgContainer.appendChild(imgElement);
                    imgContainer.appendChild(deleteButton);
                    editorRef.current.appendChild(imgContainer); // Append the image container to the editor
    
                    addImageListeners(); // Add listeners for resizing and deleting the image
                }
            } catch (error) {
                console.error('Erreur lors du téléchargement de l\'image :', error);
            }
        }
    };

    const triggerImageUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Ajouter des écouteurs pour redimensionner et supprimer l'image
    const addImageListeners = () => {
        if (editorRef.current) {
            const images = editorRef.current.querySelectorAll('.image-container');
            images.forEach(imageContainer => {
                const deleteButton = imageContainer.querySelector('.delete-image');
                if (deleteButton) {
                    deleteButton.addEventListener('click', () => {
                        imageContainer.remove();
                    });
                }
            });
        }
    };

    // Gestion de la barre d'outils (formatage)
    const handleFormat = useCallback((command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
    }, []);

    const handleFontSize = useCallback((size: string) => {
        document.execCommand('fontSize', false, size);
    }, []);

    const handleList = useCallback((type: 'ul' | 'ol') => {
        document.execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
    }, []);

    const handleTextColor = useCallback((color: string) => {
        document.execCommand('foreColor', false, color);
    }, []);

    const handleHighlight = useCallback((color: string) => {
        document.execCommand('backColor', false, color);
    }, []);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <input
                    className="text-2xl font-bold border-b focus:outline-none w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                {lastSaved && <span className="text-sm text-gray-500 ml-4">Dernière sauvegarde : {lastSaved}</span>}

                {/* Utiliser SaveDialog pour la première sauvegarde */}
                <SaveDialog user={user} onSave={saveDocument} />
            </div>

            {/* Barre d'outils de formatage */}
            <div className="flex flex-wrap gap-2 mb-4">
                {/* Boutons de mise en forme */}
                <Button size="sm" variant="outline" onClick={() => handleFormat('bold')}>
                    <Bold className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleFormat('italic')}>
                    <Italic className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleFormat('underline')}>
                    <Underline className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleFontSize('5')}>
                    <Type className="h-4 w-4" /> Grande
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleFontSize('3')}>
                    <Type className="h-4 w-4" /> Normale
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleFontSize('1')}>
                    <Type className="h-4 w-4" /> Petite
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleList('ul')}>
                    <List className="h-4 w-4" /> Puces
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleList('ol')}>
                    <ListOrdered className="h-4 w-4" /> Numérotation
                </Button>

                {/* Popover pour couleur de texte */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Palette className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40">
                        <div className="flex flex-wrap gap-2">
                            {textColors.map((color) => (
                                <Button
                                    key={color}
                                    size="sm"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleTextColor(color)}
                                />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Popover pour surlignage */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Highlighter className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40">
                        <div className="flex flex-wrap gap-2">
                            {highlightColors.map((color) => (
                                <Button
                                    key={color}
                                    size="sm"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleHighlight(color)}
                                />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Button size="sm" variant="outline" onClick={triggerImageUpload}>
                    <Image className="h-4 w-4" /> Image
                </Button>
                {/* Input pour télécharger des images */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                    accept="image/*"
                />
            </div>

            {/* Editeur de contenu */}
            <div
                ref={editorRef}
                className="border p-4 min-h-[400px] focus:outline-none"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: content }} // Charger le contenu dans l'éditeur
            ></div>

            <style jsx global>{`
                .image-container {
                    resize: both;
                    overflow: auto;
                    position: relative;
                    display: inline-block;
                }
                ul, ol {
                    padding-left: 40px;
                    list-style-position: outside;
                }
                ul {
                    list-style-type: disc;
                }
                ol {
                    list-style-type: decimal;
                }
                .delete-image {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background-color: red;
                    color: white;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default DocumentEditor;