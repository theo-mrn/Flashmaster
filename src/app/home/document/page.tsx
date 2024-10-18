'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Sélecteur de couleur

// Liste des couleurs disponibles pour les dossiers
const colorOptions = [
  { name: 'Rouge', light: '#FF6B6B', dark: '#C0392B', textColor: '#FFFFFF' },
  { name: 'Bleu', light: '#74B9FF', dark: '#2980B9', textColor: '#FFFFFF' },
  { name: 'Vert', light: '#55EFC4', dark: '#27AE60', textColor: '#FFFFFF' },
  { name: 'Violet', light: '#A29BFE', dark: '#8E44AD', textColor: '#FFFFFF' },
  { name: 'Orange', light: '#FAB1A0', dark: '#E67E22', textColor: '#FFFFFF' },
  { name: 'Rose', light: '#FAD6D6', dark: '#E57373', textColor: '#FFFFFF' }
];

type Document = {
  id: string;
  title: string;
  content: string;
  folderId?: string | null;
};

type NoteFolder = {
  id: string;
  name: string;
  colorLight: string;
  colorDark: string;
  textColor: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means "root"
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]); // Default color
  const [editingFolder] = useState<NoteFolder | null>(null); // Folder being edited
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control dialog state for folder creation/editing
  const router = useRouter();
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false); // Control dialog state for moving document
  const [documentToMove, setDocumentToMove] = useState<Document | null>(null); // Document being moved

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadDocuments(user.uid);
        await loadFolders(user.uid);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadDocuments = async (uid: string) => {
    try {
      const documentsCollection = collection(db, `users/${uid}/documents`);
      const documentsSnapshot = await getDocs(documentsCollection);
      const documentsList = documentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];
      setDocuments(documentsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents :', error);
    }
  };

  const loadFolders = async (uid: string) => {
    try {
      const foldersCollection = collection(db, `users/${uid}/notefolders`);
      const foldersSnapshot = await getDocs(foldersCollection);
      const foldersList = foldersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NoteFolder[];
      setFolders(foldersList);
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers :', error);
    }
  };

  // Fonction pour créer une nouvelle note et rediriger vers la page d'édition
  const createNewDocument = async () => {
    try {
      const newDocRef = await addDoc(collection(db, `users/${userId}/documents`), {
        title: 'Nouveau Document',
        content: '',
        folderId: selectedFolderId, // Si un dossier est sélectionné, on l'associe à la note
      });
      // Rediriger vers la page du document nouvellement créé
      router.push(`/home/document/${newDocRef.id}`);
    } catch (error) {
      console.error('Erreur lors de la création du document :', error);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;
    try {
      const folderRef = collection(db, `users/${userId}/notefolders`);
      await addDoc(folderRef, {
        name: newFolderName,
        colorLight: selectedColor.light,
        colorDark: selectedColor.dark,
        textColor: selectedColor.textColor,
      });
      setNewFolderName('');
      setSelectedColor(colorOptions[0]); // Reset to default color
      await loadFolders(userId); // Recharger les dossiers sans recharger la page
      setIsDialogOpen(false); // Fermer le dialog
    } catch (error) {
      console.error('Erreur lors de la création du dossier :', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const documentRef = doc(db, `users/${userId}/documents`, documentId);
      await deleteDoc(documentRef);
      setDocuments(documents.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error('Erreur lors de la suppression du document :', error);
    }
  };

  // Fonction pour déplacer un document vers un autre dossier
  const moveDocumentToFolder = async () => {
    if (documentToMove && selectedFolderId) {
      try {
        const documentRef = doc(db, `users/${userId}/documents`, documentToMove.id);
        await updateDoc(documentRef, { folderId: selectedFolderId });
        await loadDocuments(userId); // Recharger les documents
        setIsMoveDialogOpen(false); // Fermer le dialog de déplacement
        setDocumentToMove(null);
      } catch (error) {
        console.error('Erreur lors du déplacement du document :', error);
      }
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-4 min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-8 text-center">Tous les Documents</h1>

      {/* Bouton pour créer une nouvelle note */}
      <Button onClick={createNewDocument} className="mb-8">
        Créer un nouveau document
      </Button>

      {/* Bouton pour créer un nouveau dossier */}
      <Button onClick={() => setIsDialogOpen(true)} className="ml-3 mb-8">
        Créer un nouveau dossier
      </Button>

      {selectedFolderId === null && (
        <>
          <h2 className="text-2xl font-bold mb-4">Dossiers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="relative shadow-lg rounded-lg cursor-pointer"
                style={{
                  borderRadius: '20px',
                  height: '150px',
                  width: '200px',
                  background: `linear-gradient(to bottom, ${folder.colorLight} 50%, ${folder.colorDark} 50%)`,
                }}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <CardContent className="relative p-6 h-full flex flex-col justify-between">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="absolute top-2 right-2 text-xl bg-transparent border-none"
                        onClick={(e) => e.stopPropagation()} // Empêche la propagation du clic vers la carte
                      >
                        ⋮
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher la propagation du clic
                          setNewFolderName(folder.name);
                          setSelectedColor(colorOptions.find((c) => c.light === folder.colorLight) || colorOptions[0]);
                          setIsDialogOpen(true);
                        }}
                      >
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher la propagation du clic
                          handleDeleteDocument(folder.id);
                        }}
                        className="text-red-500"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="text-left mt-auto">
                    <h2 className="text-lg font-bold" style={{ color: folder.textColor }}>{folder.name}</h2>
                    <p className="text-sm" style={{ color: folder.textColor }}>
                      {documents.filter((n) => n.folderId === folder.id).length} documents
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">Documents sans dossier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {documents
              .filter((doc) => !doc.folderId) // Afficher uniquement les documents sans folderId
              .map((doc) => (
                <Card
                  key={doc.id}
                  className="relative shadow-lg rounded-[15px] p-6 flex flex-col justify-between"
                  style={{
                    height: '240px',
                    width: '260px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '15px',
                  }}
                  onClick={() => router.push(`/home/document/${doc.id}`)} // Ouvrir le document
                >
                  <CardContent className="relative flex flex-col justify-center items-center">
                    <h2 className="text-xl font-bold text-center mb-6">{doc.title}</h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="absolute top-2 right-2 text-xl bg-transparent border-none"
                          onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
                        >
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher la propagation du clic
                            setDocumentToMove(doc);
                            setIsMoveDialogOpen(true); // Ouvrir le dialog pour déplacer le document
                          }}
                        >
                          Déplacer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher la propagation du clic
                            handleDeleteDocument(doc.id);
                          }}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}

      {selectedFolderId && (
        <div>
          <Button className="mb-4 mt-6" onClick={() => setSelectedFolderId(null)}>
            Retour
          </Button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {documents
              .filter((doc) => doc.folderId === selectedFolderId) // Afficher uniquement les documents qui ont le folderId correspondant
              .map((doc) => (
                <Card
                  key={doc.id}
                  className="relative shadow-lg rounded-[15px] p-6 flex flex-col justify-between"
                  style={{
                    height: '240px',
                    width: '260px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '15px',
                  }}
                  onClick={() => router.push(`/home/document/${doc.id}`)} // Ouvrir le document
                >
                  <CardContent className="relative flex flex-col justify-center items-center">
                    <h2 className="text-xl font-bold text-center mb-6">{doc.title}</h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="absolute top-2 right-2 text-xl bg-transparent border-none"
                          onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
                        >
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher la propagation du clic
                            setDocumentToMove(doc);
                            setIsMoveDialogOpen(true); // Ouvrir le dialog pour déplacer le document
                          }}
                        >
                          Déplacer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher la propagation du clic
                            handleDeleteDocument(doc.id);
                          }}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Dialog pour créer ou modifier un dossier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent>
          <DialogTitle>{editingFolder ? 'Modifier le dossier' : 'Créer un dossier'}</DialogTitle>
          <DialogDescription>
            Choisissez un nom et une couleur pour votre dossier.
          </DialogDescription>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nom du dossier"
            className="mb-4"
          />
          <div className="mb-4">
            <label>Couleur :</label>
            <Select onValueChange={(value) =>
              setSelectedColor(colorOptions.find((c) => c.name === value) || colorOptions[0])
            }>
              <SelectTrigger>
                <SelectValue placeholder="Choisissez une couleur" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.name} value={color.name}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: color.light,
                          borderRadius: '50%',
                          width: '10px',
                          height: '10px',
                          display: 'inline-block',
                          marginRight: '8px',
                        }}
                      ></span>
                      {color.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateFolder}>{editingFolder ? 'Modifier' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour déplacer un document */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogTitle>Déplacer le document</DialogTitle>
          <DialogDescription>Choisissez un dossier pour déplacer le document.</DialogDescription>
          <Select onValueChange={setSelectedFolderId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un dossier" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Annuler</Button>
            <Button onClick={moveDocumentToFolder}>Déplacer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
