'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Image from 'next/image'; // Import Next.js Image component

type Flashcard = {
  front: { text: string; image?: string };
  back: { text: string };
};

export default function ViewPilePage() {
  const params = useParams();
  const router = useRouter();
  const pileId = params.pileId;
  const [pile, setPile] = useState<{ name: string; cards: Flashcard[] } | null>(null);
  const [userId, setUserId] = useState('');
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null); // Indice de la carte en édition
  const [newCardFront, setNewCardFront] = useState('');  // Valeurs de renaming
  const [newCardBack, setNewCardBack] = useState('');
  const [loading, setLoading] = useState(true); // Gestion du chargement

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        if (!pileId) return;
        const pileRef = doc(db, `users/${user.uid}/flashcards/${pileId}`); // Correction ici
        const pileDoc = await getDoc(pileRef);
        if (pileDoc.exists()) {
          setPile(pileDoc.data() as { name: string; cards: Flashcard[] });
        } else {
          console.error('La pile n\'existe pas');
        }
        setLoading(false); // Fin du chargement après récupération
      }
    });

    return () => unsubscribe();
  }, [pileId]);

  const handleRenameCard = async (index: number) => {
    if (!pile) return;

    const updatedCards = [...pile.cards];
    updatedCards[index].front.text = newCardFront || updatedCards[index].front.text;
    updatedCards[index].back.text = newCardBack || updatedCards[index].back.text;

    try {
      const pileRef = doc(db, `users/${userId}/flashcards/${pileId}`); // Correction ici
      await updateDoc(pileRef, { cards: updatedCards });
      setPile({ ...pile, cards: updatedCards });
      setEditingCardIndex(null); // Quitter le mode édition
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la carte :", error);
    }
  };

  const handleDeleteCard = async (index: number) => {
    if (!pile) return;

    const updatedCards = pile.cards.filter((_, cardIndex) => cardIndex !== index);
    try {
      const pileRef = doc(db, `users/${userId}/flashcards/${pileId}`); // Correction ici
      await updateDoc(pileRef, { cards: updatedCards });
      setPile({ ...pile, cards: updatedCards });
    } catch (error) {
      console.error("Erreur lors de la suppression de la carte :", error);
    }
  };

  if (loading) {
    return <div>Chargement...</div>; // Affichage pendant le chargement
  }

  if (!pile) {
    return <div>Aucune pile trouvée</div>; // Cas où aucune pile n'est trouvée
  }

  return (
    <div className="p-4 min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-8 text-center">{pile.name}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {pile.cards.map((card, index) => (
          <Card key={index} className="relative shadow-lg rounded-lg p-4" style={{ height: '350px', width: '100%' }}>
            <CardContent className="relative p-6">
              
              {editingCardIndex === index ? (
                <div>
                  <Input
                    value={newCardFront}
                    onChange={(e) => setNewCardFront(e.target.value)}
                    placeholder={card.front.text}
                  />
                  <Input
                    value={newCardBack}
                    onChange={(e) => setNewCardBack(e.target.value)}
                    placeholder={card.back.text}
                  />
                  <Button onClick={() => handleRenameCard(index)} className="mt-4">Enregistrer</Button>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-xl mb-3">Recto</h3>
                  <p className="text-lg">{card.front.text}</p>
                  {/* Render front image if exists using Image component */}
                  {card.front.image && (
                    <Image 
                      src={card.front.image} 
                      alt="Image recto" 
                      width={150} 
                      height={150} 
                      className="mt-2 max-w-full max-h-[150px] w-auto h-auto object-contain rounded-md"
                    />
                  )}
                  <h3 className="font-bold text-xl mt-4 mb-3">Verso</h3>
                  <p className="text-lg">{card.back.text}</p>

                  {/* Dropdown pour les options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {/* Assurez-vous qu'il n'y a qu'un seul enfant */}
                      <Button className="absolute top-0 right-0 mt-2 mr-2 text-2xl">⋮</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditingCardIndex(index)}>
                        Renommer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCard(index)} className="text-red-500">
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bouton de retour */}
      <div className="mt-8">
        <Button onClick={() => router.back()} className="text-lg py-4 px-8">
          Retour
        </Button>
      </div>
    </div>
  );
}
