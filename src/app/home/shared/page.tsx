"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, query, where, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

type Flashcard = {
  id: string;
  name: string;
  cards: Array<{ front: string; back: string; frontImage?: string; backImage?: string }>;
};

export default function SharedWithMePage() {
  const [sharedFlashcards, setSharedFlashcards] = useState<Flashcard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // Fetch flashcards shared with the current user
  const loadSharedFlashcards = async (email: string) => {
    try {
      const sharedRef = collection(db, 'shared');
      const q = query(sharedRef, where('recipientEmail', '==', email));
      const querySnapshot = await getDocs(q);

      const flashcards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        cards: doc.data().cards, // Copying the entire 'cards' array
      })) as Flashcard[];

      setSharedFlashcards(flashcards);
      setLoading(false);
    } catch (error) {
      console.error('Error loading shared flashcards:', error);
    }
  };

  // Function to add shared flashcard to user's collection and delete from shared collection
  const addFlashcardToMyPiles = async (flashcard: Flashcard) => {
    if (!userId) return;

    try {
      // Add the flashcard to the user's collection, including the full 'cards' array
      const flashcardsRef = collection(db, `users/${userId}/flashcards`);
      await addDoc(flashcardsRef, {
        name: flashcard.name,
        cards: flashcard.cards, // Adding the full flashcard details
      });

      // Show confirmation message
      setConfirmationMessage(`Flashcard "${flashcard.name}" has been added to your piles!`);

      // Remove the flashcard from the shared collection
      await deleteSharedFlashcard(flashcard.id);

      console.log('Flashcard added to your pile and removed from shared!');
    } catch (error) {
      console.error('Error adding flashcard to my pile:', error);
    }
  };

  // Function to delete a shared flashcard from Firestore
  const deleteSharedFlashcard = async (flashcardId: string) => {
    try {
      const flashcardRef = doc(db, 'shared', flashcardId);
      await deleteDoc(flashcardRef);

      // Remove the flashcard from the state
      setSharedFlashcards(sharedFlashcards.filter(card => card.id !== flashcardId));

      console.log('Flashcard deleted successfully!');
    } catch (error) {
      console.error('Error deleting shared flashcard:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email) {
          loadSharedFlashcards(user.email);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => setConfirmationMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-8 text-center">Shared Flashcards</h1>

      {/* Display confirmation message if any */}
      {confirmationMessage && (
        <div className="bg-green-100 text-green-700 p-4 mb-4 rounded-lg text-center">
          {confirmationMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sharedFlashcards.map((flashcard) => (
          <Card
            key={flashcard.id}
            className="relative shadow-lg rounded-[15px] p-6 flex flex-col justify-between"
            style={{
              height: '200px',
              width: '260px',
              backgroundColor: '#f9f9f9',
              borderRadius: '15px',
            }}
          >
            <CardContent className="relative flex flex-col justify-center items-center">
              <h2 className="text-lg font-bold text-center mb-4">{flashcard.name}</h2> {/* Displaying the pile name */}

              {/* Button to add flashcard to the user's pile and remove it from shared */}
              <Button
                onClick={() => addFlashcardToMyPiles(flashcard)}
                className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 mb-2"
              >
                Add to My Piles
              </Button>

              {/* Button to delete the shared flashcard */}
              <Button
                onClick={() => deleteSharedFlashcard(flashcard.id)}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-800"
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
