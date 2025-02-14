'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Folder, File, Plus, MoreVertical, ChevronLeft, Search, Grid, List as ListIcon, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Types
type Document = {
  id: string;
  title: string;
  content: string;
  folderId?: string | null;
  lastModified?: string;
};

type NoteFolder = {
  id: string;
  name: string;
  colorLight: string;
  colorDark: string;
  textColor: string;
};

// Constantes
const colorOptions = [
  { name: 'Indigo', light: '#818CF8', dark: '#4F46E5', textColor: '#FFFFFF' },
  { name: 'Emerald', light: '#34D399', dark: '#059669', textColor: '#FFFFFF' },
  { name: 'Rose', light: '#FB7185', dark: '#E11D48', textColor: '#FFFFFF' },
  { name: 'Amber', light: '#FCD34D', dark: '#D97706', textColor: '#FFFFFF' },
  { name: 'Sky', light: '#38BDF8', dark: '#0284C7', textColor: '#FFFFFF' },
  { name: 'Purple', light: '#A78BFA', dark: '#7C3AED', textColor: '#FFFFFF' }
];

// Ajouter les couleurs pour les documents
const documentColors = [
  { bg: "bg-gradient-to-br from-pink-600 via-pink-500 to-rose-600 hover:from-pink-700 hover:via-pink-600 hover:to-rose-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-pink-200 to-rose-200 text-pink-700 group-hover:from-pink-100 group-hover:to-rose-100",
    border: "border-pink-400/20 hover:border-pink-300/30" },
  { bg: "bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-purple-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-700 group-hover:from-indigo-100 group-hover:to-purple-100",
    border: "border-indigo-400/20 hover:border-indigo-300/30" },
  { bg: "bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 hover:from-violet-700 hover:via-violet-600 hover:to-purple-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-violet-200 to-purple-200 text-violet-700 group-hover:from-violet-100 group-hover:to-purple-100",
    border: "border-violet-400/20 hover:border-violet-300/30" },
  { bg: "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-700 group-hover:from-blue-100 group-hover:to-indigo-100",
    border: "border-blue-400/20 hover:border-blue-300/30" }
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await Promise.all([loadDocuments(user.uid), loadFolders(user.uid)]);
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

  const createNewDocument = async () => {
    try {
      const newDocRef = await addDoc(collection(db, `users/${userId}/documents`), {
        title: 'Nouveau Document',
        content: '',
        folderId: selectedFolderId,
        lastModified: new Date().toISOString(),
      });
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
      setSelectedColor(colorOptions[0]);
      await loadFolders(userId);
      setIsDialogOpen(false);
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

  const moveDocumentToFolder = async () => {
    if (documentToMove && selectedFolderId !== undefined) {
      try {
        const documentRef = doc(db, `users/${userId}/documents`, documentToMove.id);
        await updateDoc(documentRef, { folderId: selectedFolderId });
        await loadDocuments(userId);
        setIsMoveDialogOpen(false);
        setDocumentToMove(null);
      } catch (error) {
        console.error('Erreur lors du déplacement du document :', error);
      }
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFolderId === null ? !doc.folderId : doc.folderId === selectedFolderId)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Gérez et organisez vos documents et dossiers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau dossier
            </Button>
            <Button onClick={createNewDocument} className="gap-2">
              <File className="h-4 w-4" />
              Nouveau document
            </Button>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn(viewMode === 'grid' && 'bg-muted')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn(viewMode === 'list' && 'bg-muted')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation des dossiers */}
        {selectedFolderId && (
          <Button
            variant="ghost"
            className="gap-2 mb-4"
            onClick={() => setSelectedFolderId(null)}
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux dossiers
          </Button>
        )}

        {/* Liste des dossiers */}
        {!selectedFolderId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(135deg, ${folder.colorLight}, ${folder.colorDark})`,
                      }}
                    />
                    <div className="relative p-6 flex items-center gap-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: folder.colorLight }}
                      >
                        <Folder className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{folder.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {documents.filter((d) => d.folderId === folder.id).length} documents
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // Logique de modification
                          }}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Logique de suppression
                            }}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Liste des documents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + (selectedFolderId || 'root')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc, index) => {
                  const colorScheme = documentColors[index % documentColors.length];
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={cn(
                          "group relative overflow-hidden cursor-pointer border-2 shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
                          colorScheme.bg,
                          colorScheme.border
                        )}
                        onClick={() => router.push(`/home/document/${doc.id}`)}
                      >
                        {/* Effet de reflet métallique */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none opacity-75" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
                        
                        {/* Gradient overlay */}
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-b transition-all duration-500",
                          colorScheme.gradient
                        )} />
                        
                        <div className="p-6 relative">
                          {/* Icon header */}
                          <div className="mb-4">
                            <div className={cn(
                              "p-3 rounded-xl w-fit transition-all duration-500 shadow-lg transform group-hover:scale-110",
                              colorScheme.icon
                            )}>
                              <File className="h-6 w-6" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="space-y-3">
                            <h3 className="font-semibold text-lg line-clamp-1 text-white group-hover:text-white transition-colors">
                              {doc.title}
                            </h3>
                            {doc.lastModified && (
                              <div className="flex items-center gap-2 text-sm text-white/90">
                                <Calendar className="h-4 w-4" />
                                {new Date(doc.lastModified).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white hover:bg-white/20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDocumentToMove(doc);
                                  setIsMoveDialogOpen(true);
                                }}
                              >
                                Déplacer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc, index) => {
                  const colorScheme = documentColors[index % documentColors.length];
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={cn(
                          "group cursor-pointer border-2 transition-all duration-300 hover:-translate-x-1",
                          colorScheme.bg,
                          colorScheme.border
                        )}
                        onClick={() => router.push(`/home/document/${doc.id}`)}
                      >
                        {/* Effet de reflet métallique */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none opacity-75" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Gradient overlay */}
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-b transition-all duration-500",
                          colorScheme.gradient
                        )} />
                        
                        <div className="p-4 relative flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-2 rounded-lg transition-all duration-500",
                              colorScheme.icon
                            )}>
                              <File className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{doc.title}</h3>
                              {doc.lastModified && (
                                <p className="text-sm text-white/80">
                                  {new Date(doc.lastModified).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white hover:bg-white/20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDocumentToMove(doc);
                                  setIsMoveDialogOpen(true);
                                }}
                              >
                                Déplacer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dialogs */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre nouveau dossier et choisissez sa couleur.
            </DialogDescription>
            <div className="space-y-4">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nom du dossier"
              />
              <Select
                onValueChange={(value) =>
                  setSelectedColor(
                    colorOptions.find((c) => c.name === value) || colorOptions[0]
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une couleur" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.name} value={color.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.light }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateFolder}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
          <DialogContent>
            <DialogTitle>Déplacer le document</DialogTitle>
            <DialogDescription>
              Choisissez un dossier de destination pour votre document.
            </DialogDescription>
            <Select onValueChange={setSelectedFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un dossier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Racine</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={moveDocumentToFolder}>Déplacer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
