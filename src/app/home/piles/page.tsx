'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { EllipsisVertical} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, getDoc,deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Select de chadcn UI

// Liste des couleurs disponibles (nom et code hex)
const colorOptions = [
  { name: 'Rouge', light: '#FF6B6B', dark: '#C0392B', textColor: '#FFFFFF' },
  { name: 'Bleu', light: '#74B9FF', dark: '#2980B9', textColor: '#FFFFFF' },
  { name: 'Vert', light: '#55EFC4', dark: '#27AE60', textColor: '#FFFFFF' },
  { name: 'Violet', light: '#A29BFE', dark: '#8E44AD', textColor: '#FFFFFF' },
  { name: 'Orange', light: '#FAB1A0', dark: '#E67E22', textColor: '#FFFFFF' },
  { name: 'Rose', light: '#FAD6D6', dark: '#E57373', textColor: '#FFFFFF' }
];

type Flashcard = {
  question: string;
  answer: string;
};

type FlashcardPile = {
  id: string;
  name: string;
  cards: Flashcard[]; 
  folderId?: string | null;
};


type Folder = {
  id: string;
  name: string;
  colorLight: string;
  colorDark: string;
  textColor: string;
};


export default function PilesPage() {
  const [piles, setPiles] = useState<FlashcardPile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means "root"
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]); // Default color
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null); // Folder being edited
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control dialog state for editing
  const router = useRouter();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false); // State to control dialog visibility
const [recipientEmail, setRecipientEmail] = useState(''); // State to capture recipient email
const [selectedPileId, setSelectedPileId] = useState<string | null>(null); // State to track which pile is being shared

const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
const [pileToMove, setPileToMove] = useState<string | null>(null);
const [targetFolderId, setTargetFolderId] = useState<string | null>(null);


const handleMovePile = async () => {
  if (!pileToMove || !targetFolderId) {
    console.error("Pile ou dossier non sélectionné !");
    return;
  }

  try {
    const pileRef = doc(db, `users/${userId}/flashcards`, pileToMove);
    await updateDoc(pileRef, { folderId: targetFolderId });

    // Mettre à jour les piles localement
    const updatedPiles = piles.map((pile) =>
      pile.id === pileToMove ? { ...pile, folderId: targetFolderId } : pile
    );
    setPiles(updatedPiles);

    closeMoveDialog(); // Fermer le dialogue après déplacement
  } catch (error) {
    console.error("Erreur lors du déplacement de la pile :", error);
  }
};



// Fonction pour ouvrir le dialogue de déplacement
const openMoveDialog = (pileId: string) => {
  setPileToMove(pileId);
  setIsMoveDialogOpen(true);
};

// Fonction pour fermer le dialogue
const closeMoveDialog = () => {
  setIsMoveDialogOpen(false);
  setPileToMove(null);
  setTargetFolderId(null);
};

// Function to open the dialog and set the current pileId
const openShareDialog = (pileId: string) => {
  setSelectedPileId(pileId);
  setIsShareDialogOpen(true);
};

// Function to close the dialog and reset states
const closeShareDialog = () => {
  setIsShareDialogOpen(false);
  setRecipientEmail('');
  setSelectedPileId(null);
};

// Fonction pour supprimer une flashcard
const handleDeleteFlashcard = async (pileId: string) => {
  try {
    const pileRef = doc(db, `users/${userId}/flashcards`, pileId);
    await deleteDoc(pileRef);
    setPiles(piles.filter((pile) => pile.id !== pileId));
  } catch (error) {
    console.error("Erreur lors de la suppression de la flashcard :", error);
  }
};


const handleShare = async () => {
  if (!recipientEmail || !selectedPileId) {
    console.error('Recipient email or pile ID missing!');
    return;
  }

  try {
    // Get reference to the flashcards in the selected pile
    const pileRef = doc(db, `users/${userId}/flashcards`, selectedPileId);
    const pileSnap = await getDoc(pileRef);

    if (pileSnap.exists()) {
      const pileData = pileSnap.data();
      const sharedRef = collection(db, 'shared'); 
      await addDoc(sharedRef, {
        ...pileData,
        sharedBy: userId, // Track who shared the flashcards
        sharedAt: new Date(),
        recipientEmail: recipientEmail, // Add the recipient email to the shared document
      });
      closeShareDialog(); // Close the dialog after sharing
    } else {
      console.error('Pile does not exist!');
    }
  } catch (error) {
    console.error('Error sharing the flashcards:', error);
  }
};

  

  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadPiles(user.uid);
        await loadFolders(user.uid);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadPiles = async (uid: string) => {
    try {
      const pilesCollection = collection(db, `users/${uid}/flashcards`);
      const pilesSnapshot = await getDocs(pilesCollection);
      const pilesList = pilesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FlashcardPile[];
      setPiles(pilesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des piles :', error);
    }
  };

  const loadFolders = async (uid: string) => {
    try {
      const foldersCollection = collection(db, `users/${uid}/folders`);
      const foldersSnapshot = await getDocs(foldersCollection);
      const foldersList = foldersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Folder[];
      setFolders(foldersList);
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers :', error);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;
    try {
      const folderRef = collection(db, `users/${userId}/folders`);
      await addDoc(folderRef, {
        name: newFolderName,
        colorLight: selectedColor.light,
        colorDark: selectedColor.dark,
        textColor: selectedColor.textColor,
      });
      setNewFolderName('');
      setSelectedColor(colorOptions[0]); // Reset to default color
      await loadFolders(userId); // Recharger les dossiers sans recharger la page
    } catch (error) {
      console.error('Erreur lors de la création du dossier :', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Supprimer toutes les piles dans ce dossier
      const pilesQuery = query(
        collection(db, `users/${userId}/flashcards`),
        where('folderId', '==', folderId)
      );
      const pilesSnapshot = await getDocs(pilesQuery);
      const batchPromises = pilesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(batchPromises);

      // Supprimer le dossier
      const folderRef = doc(db, `users/${userId}/folders`, folderId);
      await deleteDoc(folderRef);
      setPiles(piles.filter((pile) => pile.folderId !== folderId));
      setFolders(folders.filter((folder) => folder.id !== folderId));
      setSelectedFolderId(null); // Retourner à la racine
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier :', error);
    }
  };



  const handleEditFolder = async () => {
    if (editingFolder && newFolderName.trim() !== '') {
      try {
        const folderRef = doc(db, `users/${userId}/folders`, editingFolder.id);
        await updateDoc(folderRef, {
          name: newFolderName,
          colorLight: selectedColor.light,
          colorDark: selectedColor.dark,
          textColor: selectedColor.textColor,
        });
        setEditingFolder(null); // Clear editing state
        setNewFolderName(''); // Reset input
        setSelectedColor(colorOptions[0]); // Reset color
        await loadFolders(userId); // Reload folders
        setIsDialogOpen(false); // Close the dialog
      } catch (error) {
        console.error('Erreur lors de la modification du dossier :', error);
      }
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }


  return (
    <div className="p-4 min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-8 text-center">Toutes les Piles de Flashcards</h1>

      {/* Dialog pour créer ou modifier un dossier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Ajouter un dossier</Button>
        </DialogTrigger>
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
          <Button onClick={editingFolder ? handleEditFolder : handleCreateFolder}>
            {editingFolder ? 'Modifier' : 'Créer'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
  <DialogContent>
    <DialogTitle>Partager les Flashcards</DialogTitle>
    <DialogDescription>
      Entrez l&rsquo;adresse e-mail du destinataire pour partager ces flashcards.
    </DialogDescription>
    
    {/* Input field for recipient email */}
    <Input
      value={recipientEmail}
      onChange={(e) => setRecipientEmail(e.target.value)}
      placeholder="Adresse e-mail du destinataire"
      type="email"
      className="mb-4"
    />
    
    <Button onClick={handleShare}>
      Partager
    </Button>
    
   
    <Button variant="secondary" onClick={closeShareDialog}>
      Annuler
    </Button>
  </DialogContent>
</Dialog>



      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
  <DialogTrigger asChild>
    {/* Tu peux utiliser un bouton ou un autre élément pour ouvrir le dialogue */}
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Deplacer la pile</DialogTitle>
    <DialogDescription>Choisissez un dossier vers lequel deplacer cette pile.</DialogDescription>
    <div className="mb-4">
      <label>Dossier :</label>
      <Select onValueChange={(value) => setTargetFolderId(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Choisissez un dossier" />
        </SelectTrigger>
        <SelectContent>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id}>
              {folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <Button onClick={handleMovePile}>Déplacer</Button>
  </DialogContent>
</Dialog>




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
                  onClick={(e) => e.stopPropagation()} 
                >
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                    setNewFolderName(folder.name);
                    setSelectedColor(colorOptions.find((c) => c.light === folder.colorLight) || colorOptions[0]);
                    setIsDialogOpen(true);
                  }}
                >
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
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
                {piles.filter((p) => p.folderId === folder.id).length} fichiers
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <h2 className="text-2xl font-bold mt-8 mb-4">Flashcards sans dossier</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {piles
        .filter((pile) => !pile.folderId) // Afficher uniquement les piles sans folderId
        .map((pile) => (
          <Card
            key={pile.id}
            className="relative shadow-lg rounded-[15px] p-6 flex flex-col justify-between"
            style={{
              height: '240px',
              width: '260px',
              backgroundColor: '#f9f9f9',
              borderRadius: '15px',
            }}
          >
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                    <EllipsisVertical className="w-6 h-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => openShareDialog(pile.id)}>
                    Partager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openMoveDialog(pile.id)}>
                    Déplacer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => handleDeleteFlashcard(pile.id)}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardContent className="relative flex flex-col justify-center items-center">
              <h2 className="text-xl font-bold text-center mb-6">{pile.name}</h2>
              <div className="flex justify-center mt-16 space-x-3">
                <Button
                  onClick={() => router.push(`/home/piles/${pile.id}/train`)}
                  className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800"
                >
                  S&rsquo;entraîner
                </Button>

                <Button
                  onClick={() => router.push(`/home/piles/${pile.id}/view`)}
                  className="bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 hover:text-gray-700"
                >
                  Voir
                </Button>
              </div>
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
      {piles
        .filter((pile) => pile.folderId === selectedFolderId) // Afficher uniquement les piles qui ont le folderId correspondant
        .map((pile) => (
          <Card
            key={pile.id}
            className="relative shadow-lg rounded-[15px] p-6 flex flex-col justify-between"
            style={{
              height: '240px',
              width: '260px',
              backgroundColor: '#f9f9f9',
              borderRadius: '15px',
            }}
          >
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                    <EllipsisVertical className="w-6 h-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => openShareDialog(pile.id)}>
                    Partager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openMoveDialog(pile.id)}>
                    Déplacer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => handleDeleteFlashcard(pile.id)}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardContent className="relative flex flex-col justify-center items-center">
              <h2 className="text-xl font-bold text-center mb-6">{pile.name}</h2>
              <div className="flex justify-center mt-16 space-x-3">
                <Button
                  onClick={() => router.push(`/home/piles/${pile.id}/train`)}
                  className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800"
                >
                  S&rsquo;entraîner
                </Button>

                <Button
                  onClick={() => router.push(`/home/piles/${pile.id}/view`)}
                  className="bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 hover:text-gray-700"
                >
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  </div>
)}



    </div>
  );
}
