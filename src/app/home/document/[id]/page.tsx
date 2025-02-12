"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Navigation Next.js 13+
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Firebase setup
import { onAuthStateChanged, User } from 'firebase/auth'; // Firebase User type
import { Bold, Italic, Underline, List, ListOrdered, Type, Palette, Highlighter, Image, Menu, AlignLeft, AlignCenter, AlignRight, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Bouton
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DialogShare } from "@/components/ui/DialogShare"; // Corriger l'import
import { BackgroundSelector } from "@/components/ui/BackgroundSelector"; // Corriger l'import
import { SaveDialog } from "@/components/ui/save-dialog"; // Corriger l'import
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const textColors = ['black', 'red', 'blue', 'green', 'purple', 'orange'];
const highlightColors = ['yellow', 'lime', 'cyan', 'pink', 'lavender', 'orange'];

const DocumentEditor: React.FC = () => {
    const router = useRouter();
    const { id } = useParams(); // Récupérer l'ID du document depuis l'URL
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Référence pour l'input d'images
    const [user, setUser] = useState<User | null>(null);
    const [title, setTitle] = useState<string>('Document sans titre');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [background, setBackground] = useState<string>('/images/forest.jpg');

    // Ajouter cette fonction pour gérer le changement de fond
    const handleBackgroundChange = (newBackground: string) => {
        setBackground(newBackground);
        localStorage.setItem(`doc_${id}_background`, newBackground);
    };

    // Ajouter cet effet pour charger le fond sauvegardé
    useEffect(() => {
        if (id) {
            const savedBackground = localStorage.getItem(`doc_${id}_background`);
            if (savedBackground) {
                setBackground(savedBackground);
            }
        }
    }, [id]);

    // Ajouter ces fonctions pour la gestion du localStorage
    const saveToLocalStorage = useCallback(() => {
        if (id && editorRef.current) {
            localStorage.setItem(`doc_${id}_content`, editorRef.current.innerHTML);
            localStorage.setItem(`doc_${id}_title`, title);
        }
    }, [id, title]);

    // Fonction pour charger depuis le localStorage
    const loadFromLocalStorage = useCallback(() => {
        if (id) {
            const savedContent = localStorage.getItem(`doc_${id}_content`);
            const savedTitle = localStorage.getItem(`doc_${id}_title`);
            if (savedContent && editorRef.current) {
                editorRef.current.innerHTML = savedContent;
            }
            if (savedTitle) setTitle(savedTitle);
        }
    }, [id]);

    // Charger le document depuis Firebase
    const fetchDocument = useCallback(async (uid: string) => {
        if (id) {
            loadFromLocalStorage();
    
            try {
                const docRef = doc(db, `users/${uid}/documents`, id as string);
                const docSnapshot = await getDoc(docRef);
    
                if (docSnapshot.exists()) {
                    const docData = docSnapshot.data();
                    setTitle(docData.title || 'Sans titre');
                    if (docData.background) {
                        setBackground(docData.background);
                        localStorage.setItem(`doc_${id}_background`, docData.background);
                    }
                    if (docData.lastSaved) {
                        setLastSaved(formatLastSaved(docData.lastSaved));
                    }
                } else {
                    console.log("Document non trouvé.");
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du document :', error);
            }
        }
    }, [id, loadFromLocalStorage]);

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

    // Ajouter un auto-save pour le localStorage
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (editorRef.current) {
                localStorage.setItem(`doc_${id}_content`, editorRef.current.innerHTML);
                localStorage.setItem(`doc_${id}_title`, title);
            }
        }, 2000); // Réduire à 2 secondes pour plus de réactivité

        return () => clearInterval(autoSaveInterval);
    }, [id, title]);

    // Effet corrigé pour l'éditeur
    useEffect(() => {
        if (editorRef.current) {
            const editor = editorRef.current;
            const handleInput = () => {
                localStorage.setItem(`doc_${id}_content`, editor.innerHTML);
            };

            editor.addEventListener('input', handleInput);
            return () => {
                editor.removeEventListener('input', handleInput);
            };
        }
    }, [id]);

    // Ajouter un effet pour charger le contenu local au montage
    useEffect(() => {
        loadFromLocalStorage();
    }, [loadFromLocalStorage]);

    // Modifier la fonction de formatage de la date/heure
    const formatLastSaved = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long'
        });
    };

    const saveDocument = async () => {
        if (editorRef.current && user) {
            const updatedContent = editorRef.current.innerHTML;
            const saveTime = new Date().toISOString();
            try {
                const docRef = id
                    ? doc(db, `users/${user.uid}/documents`, id as string)
                    : await addDoc(collection(db, `users/${user.uid}/documents`), {
                          title,
                          content: updatedContent
                      });
    
                if (id) {
                    await setDoc(docRef, {
                        title,
                        content: updatedContent,
                        background: background, // Ajout du background
                        lastSaved: new Date().toISOString()
                    });
                }
    
                saveToLocalStorage();
                setLastSaved(formatLastSaved(saveTime));
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

    const handleShare = async (recipientEmail: string) => {
        if (!user || !id || !editorRef.current) return;
        
        try {
            const docRef = doc(db, 'shared_notes', id.toString());
            await setDoc(docRef, {
                title: title,
                content: editorRef.current.innerHTML,
                recipientEmail: recipientEmail,
                sharedBy: user.uid,
                sharedAt: new Date().toISOString()
            });
            
            console.log('Document partagé avec succès');
        } catch (error) {
            console.error('Erreur lors du partage du document:', error);
        }
    };

    const handleAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
        document.execCommand(`justify${alignment.charAt(0).toUpperCase()}${alignment.slice(1)}`, false);
    }, []);

    const handleMoveDocument = async (title: string, folderId: string | null) => {
        if (!user || !id) return;
        try {
            const docRef = doc(db, `users/${user.uid}/documents`, id as string);
            await setDoc(docRef, {
                folderId: folderId,
            }, { merge: true });
            console.log('Document déplacé avec succès');
        } catch (error) {
            console.error('Erreur lors du déplacement du document:', error);
        }
    };

    const handleBack = () => {
        router.push('/home/document');
    };

    return (
        <div className="min-h-screen relative">
            {/* Background image */}
            <div 
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            
            {/* Glassy container */}
            <div className="relative z-10 min-h-screen  backdrop-blur-ld">
                <div className="container mx-auto p-4 max-w-5xl  rounded-lg bg-white/30">
                    <div className="flex justify-between items-center mb-4 ">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={handleBack}
                                className="hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <input
                                className="text-2xl font-bold border-b focus:outline-none bg-transparent max-w-[300px]"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            {lastSaved && (
                                <span className="text-sm text-gray-700 ml-4 flex items-center mr-8 ">
                                    Dernière sauvegarde : {lastSaved}
                                </span>
                            )}
                            <Button onClick={saveDocument}>Enregistrer</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="default" className="gap-2">
                                        <Menu className="h-5 w-5" />
                                        Menu
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem 
                                        onClick={() => document.getElementById('shareDialog')?.click()}
                                        className="p-3 cursor-pointer"
                                    >
                                        Partager
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => document.getElementById('backgroundDialog')?.click()}
                                        className="p-3 cursor-pointer"
                                    >
                                        Changer le fond
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => document.getElementById('moveDialog')?.click()}
                                        className="p-3 cursor-pointer"
                                    >
                                        Déplacer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Barre d'outils avec fond glassy */}
                    <div className="flex flex-wrap gap-2 mb-4 p-2 rounded-lg backdrop-blur-sm bg-white/40">
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

                        <Button size="sm" variant="outline" onClick={() => handleAlignment('left')}>
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAlignment('center')}>
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAlignment('right')}>
                            <AlignRight className="h-4 w-4" />
                        </Button>

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

                    {/* Editeur avec fond glassy */}
                    <div
                        ref={editorRef}
                        className="border p-4 flex-grow focus:outline-none rounded-lg backdrop-blur-sm bg-white/40"
                        style={{ minHeight: 'calc(100vh - 200px)' }} // Ajuster la hauteur en fonction de l'en-tête
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                            const target = e.target as HTMLDivElement;
                            localStorage.setItem(`doc_${id}_content`, target.innerHTML);
                        }}
                    />

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
            </div>
            <DialogShare
                id="shareDialog"
                onShare={handleShare}
            />
            <BackgroundSelector
                id="backgroundDialog"
                onSelect={handleBackgroundChange}
            />
            <SaveDialog 
                id="moveDialog"
                user={user}
                onSave={handleMoveDocument}
                currentTitle={title}
            />
        </div>
    );
};

export default DocumentEditor;