'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Dialog components
import { db } from '@/lib/firebase'; // Removed unused 'auth' import
import { collection, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image'; // Importing Image component from next/image

interface CardSide {
  text: string;
  image?: string;
}

interface FlashCard {
  front: CardSide;
  back: CardSide;
}

export default function FlashcardCreator() {
  const [cards, setCards] = useState<FlashCard[]>([{ front: { text: '' }, back: { text: '' } }]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isShowingFront, setIsShowingFront] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pileName, setPileName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false); // For controlling the dialog state
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState(''); // Message after saving the pile

  // Récupérer l'UID de l'utilisateur connecté
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.error('Aucun utilisateur connecté');
      }
    });
  }, []);

  const handleTextChange = (side: 'front' | 'back', value: string) => {
    const newCards = [...cards];
    newCards[currentCardIndex][side].text = value;
    setCards(newCards);
  };

  const addNewCard = () => {
    setCards([...cards, { front: { text: '' }, back: { text: '' } }]);
    setCurrentCardIndex(cards.length);
    setIsShowingFront(true);
  };

  const navigateCards = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else if (direction === 'next' && currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
    setIsShowingFront(true);
  };

  const flipCard = () => {
    setIsShowingFront(!isShowingFront);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCards = [...cards];
        const side = isShowingFront ? 'front' : 'back';
        newCards[currentCardIndex][side].image = reader.result as string;
        setCards(newCards);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePile = async () => {
    if (pileName.trim() && cards.length > 0) {
      try {
        const userFlashcardsCollection = collection(db, `users/${userId}/flashcards`);
        await addDoc(userFlashcardsCollection, {
          name: pileName,
          cards: cards,
        });
        console.log('Pile enregistrée avec succès');
        setPileName('');
        setCards([{ front: { text: '' }, back: { text: '' } }]); // Reset after saving
        setIsDialogOpen(false); // Close the dialog after saving
        setMessage('Pile enregistrée avec succès !'); // Show success message
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la pile:', error);
      }
    }
  };

  // Ensure the currentCardIndex is valid
  const currentCard = cards[currentCardIndex] || { front: { text: '' }, back: { text: '' } };
  const currentSide = isShowingFront ? currentCard.front : currentCard.back;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 space-y-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6">
          <div className="mb-4 text-center">
            <span className="text-sm text-gray-500">Carte {currentCardIndex + 1} sur {cards.length}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex + (isShowingFront ? 'front' : 'back')}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.3 }}
              className="mb-4 space-y-4"
            >
              {currentSide.image && (
                <div className="flex justify-center">
                  <Image 
                    src={currentSide.image} 
                    alt={`Image ${isShowingFront ? 'recto' : 'verso'} de la carte`} 
                    width={300} 
                    height={200}
                    className="max-w-full h-auto max-h-[200px] rounded-md"
                  />
                </div>
              )}
              <Textarea
                placeholder={`Texte ${isShowingFront ? 'recto' : 'verso'} de la carte`}
                value={currentSide.text}
                onChange={(e) => handleTextChange(isShowingFront ? 'front' : 'back', e.target.value)}
                className="min-h-[150px] resize-none"
              />
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mb-4 space-x-2">
            <Button onClick={() => navigateCards('prev')} disabled={currentCardIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={flipCard}>Retourner</Button>
            <Button onClick={() => navigateCards('next')} disabled={currentCardIndex === cards.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between">
            <div className="space-x-2">
              <Button onClick={addNewCard}>Nouvelle carte</Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Ajouter une image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer la pile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Nommer la pile</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <Input
                    value={pileName}
                    onChange={(e) => setPileName(e.target.value)}
                    placeholder="Nom de la pile"
                    className="text-lg py-6"
                  />
                  <Button onClick={handleSavePile} className="w-full text-lg py-6">Enregistrer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {message && (
            <div className="mt-4 text-green-500 font-bold text-center">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
