'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image'; // Import Next.js Image component

type Flashcard = {
  front: { text: string; image?: string };
  back: { text: string; image?: string };
};

export default function TrainPilePage() {
  const params = useParams();
  const pileId = params.pileId;
  const [pile, setPile] = useState<{ name: string; cards: Flashcard[] } | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        if (!pileId) return;
        const pileRef = doc(db, `users/${user.uid}/flashcards/${pileId}`);
        const pileDoc = await getDoc(pileRef);
        if (pileDoc.exists()) {
          setPile(pileDoc.data() as { name: string; cards: Flashcard[] });
        }
      }
    });

    return () => unsubscribe();
  }, [pileId]);

  const saveResults = async (percentage: number) => {
    if (!userId || !pile) return;

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-CA');

    const statsRef = doc(db, `users/${userId}/statistics`, formattedDate);
    const statsDoc = await getDoc(statsRef);

    let previousStats = {
      pourcentage: 0,
      cartesApprises: 0,
      totalCartes: 0,
    };

    if (statsDoc.exists()) {
      previousStats = statsDoc.data() as {
        pourcentage: number;
        cartesApprises: number;
        totalCartes: number;
      };
    }

    const newTotalCartes = previousStats.totalCartes + pile.cards.length;
    const newCartesApprises = previousStats.cartesApprises + pile.cards.length;

    const newPourcentage = previousStats.totalCartes > 0
      ? ((previousStats.pourcentage * previousStats.totalCartes) + (percentage * pile.cards.length)) / newTotalCartes
      : percentage;

    const newStats = {
      date: formattedDate,
      pourcentage: newPourcentage,
      cartesApprises: newCartesApprises,
      totalCartes: newTotalCartes,
      timestamp: currentDate.getTime(),
    };

    await setDoc(statsRef, newStats, { merge: true });
  };

  if (!pile) {
    return <div>Chargement...</div>;
  }

  const currentCard = pile.cards[currentCardIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (knew: boolean) => {
    if (knew) {
      setScore(score + 1);
    }
    if (currentCardIndex < pile.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      const totalScore = score + (knew ? 1 : 0);
      const percentage = pile.cards.length > 0 ? (totalScore / pile.cards.length) * 100 : 0;

      setIsFinished(true);
      saveResults(percentage);
    }
  };

  const resetExercise = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const percentage = (score / pile.cards.length) * 100;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Exercice terminé !</h2>
            <p className="text-2xl mb-4">Votre score : {score} / {pile.cards.length}</p>
            <p className="text-xl mb-6">Pourcentage de réussite : {percentage.toFixed(2)}%</p>
            <Button onClick={resetExercise} className="text-lg py-4 px-8">Recommencer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">{pile.name}</h1>
      <Card className="w-full max-w-2xl mb-8">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <span className="text-xl">Carte {currentCardIndex + 1} sur {pile.cards.length}</span>
          </div>
          <div className="min-h-[300px] flex items-center justify-center">
            {isFlipped ? (
              <div>
                <p className="text-2xl mb-4">{currentCard.back.text}</p>
                {currentCard.back.image && (
                  <Image 
                    src={currentCard.back.image} 
                    alt="Image verso" 
                    width={150}
                    height={150}
                    className="max-w-full max-h-[150px] w-auto h-auto object-contain mx-auto rounded-md"
                  />
                )}
              </div>
            ) : (
              <div>
                <p className="text-2xl mb-4">{currentCard.front.text}</p>
                {currentCard.front.image && (
                  <Image 
                    src={currentCard.front.image} 
                    alt="Image recto" 
                    width={150}
                    height={150}
                    className="max-w-full max-h-[150px] w-auto h-auto object-contain mx-auto rounded-md"
                  />
                )}
              </div>
            )}
          </div>
          <Button onClick={handleFlip} className="mt-6 text-lg py-4 px-8">
            {isFlipped ? "Cacher la réponse" : "Afficher la réponse"}
          </Button>
        </CardContent>
      </Card>
      {isFlipped && (
        <div className="flex space-x-4">
          <Button onClick={() => handleAnswer(false)} className="text-lg py-4 px-8 bg-red-500 hover:bg-red-600">Je ne savais pas</Button>
          <Button onClick={() => handleAnswer(true)} className="text-lg py-4 px-8 bg-green-500 hover:bg-green-600">Je savais</Button>
        </div>
      )}
    </div>
  );
}
