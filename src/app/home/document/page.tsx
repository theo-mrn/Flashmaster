"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Bold, Italic, List, Type, Save, ListOrdered, Palette, Underline, Highlighter, Trash, Eye } from 'lucide-react';
import { User } from "firebase/auth";
import { db, auth } from '@/lib/firebase'; // Importation de Firebase
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const textColors = ['black', 'red', 'blue', 'green', 'purple', 'orange'];
const highlightColors = ['yellow', 'lime', 'cyan', 'pink', 'lavender', 'orange'];

const EnhancedEditor: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('Document sans titre');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null); // Stocker l'ID du document ouvert
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false); // Suivre les modifications non enregistrées
  const [showDialog, setShowDialog] = useState<boolean>(false); // Contrôler l'ouverture du Dialog
  const editorRef = useRef<HTMLDivElement>(null);

  // Utiliser onAuthStateChanged pour écouter les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Si l'utilisateur est connecté, on met à jour l'état user
      } else {
        console.log('Utilisateur non connecté');
      }
    });

    return () => unsubscribe(); // Nettoyage lors du démontage du composant
  }, []);

  const handleFormat = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  }, []);

  const handleFontSize = useCallback((size: string) => {
    document.execCommand('fontSize', false, size);
  }, []);

  const handleList = useCallback((type: 'ul' | 'ol') => {
    if (type === 'ul') {
      document.execCommand('insertUnorderedList', false);
    } else {
      document.execCommand('insertOrderedList', false);
    }
  }, []);

  const handleTextColor = useCallback((color: string) => {
    document.execCommand('foreColor', false, color);
  }, []);

  const handleHighlight = useCallback((color: string) => {
    document.execCommand('backColor', false, color);
  }, []);

  interface DocumentData {
    id: string;
    title: string;
    content: string;
    lastSaved: string;
  }
  const [documents, setDocuments] = useState<DocumentData[]>([]); // Already using proper type

  // Fonction pour créer un nouveau document dans Firestore
  const createNewDocument = async () => {
    if (editorRef.current && user) {
      const content = editorRef.current.innerHTML; // Sauvegarder le contenu actuel de l'éditeur
      try {
        const newDocRef = doc(collection(db, `users/${user.uid}/documents`)); // Générer un nouvel ID automatiquement
        await setDoc(newDocRef, {
          id: newDocRef.id, // Stocker l'ID généré dans le document lui-même
          title,
          content,
          lastSaved: new Date().toISOString(),
        });
        console.log("Nouveau document sauvegardé avec succès !");
        setLastSaved(new Date().toLocaleTimeString());
        setUnsavedChanges(false); // Réinitialiser l'état des modifications non enregistrées
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du document:', error);
      }
    }
  };

  // Fonction pour récupérer les documents de l'utilisateur
  const fetchDocuments = async () => {
    if (user) {
      try {
        const querySnapshot = await getDocs(collection(db, `users/${user.uid}/documents`));
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled', // Valeur par défaut
          content: doc.data().content || '',
          lastSaved: doc.data().lastSaved || new Date().toISOString(),
        }));
        setDocuments(docs);
      } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
      }
    }
  };

  // Fonction pour supprimer un document de Firestore
  const deleteDocument = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/documents`, id));
        setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== id)); // Mettre à jour la liste des documents
        if (id === currentDocumentId) {
          setCurrentDocumentId(null); // Réinitialiser l'ID du document ouvert si celui-ci a été supprimé
          if (editorRef.current) {
            editorRef.current.innerHTML = ''; // Effacer le contenu de l'éditeur
          }
          setTitle('Document sans titre'); // Réinitialiser le titre
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du document:', error);
      }
    }
  };

  // Fonction pour ouvrir un document et remplacer le contenu de l'éditeur
  const openDocument = async (docId: string, docContent: string, docTitle: string) => {
    if (unsavedChanges) {
      const confirmSave = confirm("Voulez-vous enregistrer les modifications avant d'ouvrir un autre document ?");
      if (confirmSave) {
        await createNewDocument(); // Créer un nouveau document avant de continuer
      }
    }
    setCurrentDocumentId(docId); // Stocker l'ID du document ouvert
    setTitle(docTitle); // Mettre à jour le titre du document
    if (editorRef.current) {
      editorRef.current.innerHTML = docContent; // Remplacer le contenu de l'éditeur par celui du document
    }
    setUnsavedChanges(false); // Réinitialiser l'état des modifications
    setShowDialog(false); // Fermer le dialog
  };

  // Détecter les modifications dans l'éditeur pour afficher un avertissement de non-enregistrement
  const handleEditorInput = () => {
    setUnsavedChanges(true);
  };

  const ColorButton = ({ onColorSelect, colors, icon }: { onColorSelect: (color: string) => void, colors: string[], icon: React.ReactNode }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40">
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <Button
              key={color}
              size="sm"
              style={{ backgroundColor: color }}
              onClick={() => onColorSelect(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none"
        />
        <div className="flex items-center space-x-4">
          {lastSaved && <span className="text-sm text-muted-foreground">Dernière sauvegarde : {lastSaved}</span>}
          <Button onClick={createNewDocument}>
            <Save className="mr-2 h-4 w-4" /> Sauvegarder
          </Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={fetchDocuments}>Ouvrir</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Documents sauvegardés</DialogTitle>
                <DialogDescription>Aperçu et gestion des documents.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="border p-4 rounded-md shadow space-y-4">
                    <div>
                      <strong className="block text-lg mb-1">{doc.title}</strong>
                      <p className="text-sm text-gray-500">Dernière modification : {doc.lastSaved}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" onClick={() => openDocument(doc.id, doc.content, doc.title)} className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" /> Ouvrir
                      </Button>
                      <Button variant="destructive" onClick={() => deleteDocument(doc.id)} className="flex items-center">
                        <Trash className="mr-2 h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                    <div className="border p-2 bg-gray-100 max-h-24 overflow-auto">
                      <div
                        dangerouslySetInnerHTML={{ __html: doc.content }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2 sticky top-0 bg-background z-10 p-2 border-b">
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
          <List className="h-4 w-4" /> Puce pleine
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleList('ol')}>
          <ListOrdered className="h-4 w-4" /> Liste numérotée
        </Button>
        <ColorButton onColorSelect={handleTextColor} colors={textColors} icon={<Palette className="h-4 w-4" />} />
        <ColorButton onColorSelect={handleHighlight} colors={highlightColors} icon={<Highlighter className="h-4 w-4" />} />
      </div>

      <div
        ref={editorRef}
        className="flex-grow overflow-auto p-4 focus:outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorInput}
      >
        <p>Bienvenue dans votre nouvel éditeur de document amélioré. Commencez à écrire ici...</p>
      </div>

      <style jsx global>{`
        [contenteditable] {
          outline: 0px solid transparent;
        }
        [contenteditable]:focus {
          outline: 0px solid transparent;
        }
        ul, ol {
          padding-left: 40px !important;
          list-style-position: outside !important;
        }
        ul {
          list-style-type: disc !important;
        }
        ol {
          list-style-type: decimal !important;
        }
      `}</style>
    </div>
  );
};

export default EnhancedEditor;