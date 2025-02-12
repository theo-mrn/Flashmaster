"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, query, where, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type Flashcard = {
  id: string;
  name: string;
  cards: Array<{ front: string; back: string; frontImage?: string; backImage?: string }>;
};

type Note = {
  id: string;
  title: string;
  content: string;
  sharedBy: string;
  sharedAt: string;
};

export default function SharedWithMePage() {
  const [sharedFlashcards, setSharedFlashcards] = useState<Flashcard[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const router = useRouter();

  const loadSharedContent = async (email: string) => {
    try {
      const sharedFlashcardsRef = collection(db, 'shared');
      const flashcardsQuery = query(sharedFlashcardsRef, where('recipientEmail', '==', email));
      const flashcardsSnapshot = await getDocs(flashcardsQuery);

      const flashcards = flashcardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flashcard[];

      const sharedNotesRef = collection(db, 'shared_notes');
      const notesQuery = query(sharedNotesRef, where('recipientEmail', '==', email));
      const notesSnapshot = await getDocs(notesQuery);

      const notes = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];

      setSharedFlashcards(flashcards);
      setSharedNotes(notes);
      setLoading(false);
    } catch (error) {
      console.error('Error loading shared content:', error);
    }
  };

  const addFlashcardToMyPiles = async (flashcard: Flashcard) => {
    if (!userId) return;

    try {
      const flashcardsRef = collection(db, `users/${userId}/flashcards`);
      await addDoc(flashcardsRef, {
        name: flashcard.name,
        cards: flashcard.cards,
      });

      setConfirmationMessage(`Flashcard "${flashcard.name}" has been added to your piles!`);
      await deleteSharedFlashcard(flashcard.id);

      console.log('Flashcard added to your pile and removed from shared!');
    } catch (error) {
      console.error('Error adding flashcard to my pile:', error);
    }
  };

  const deleteSharedFlashcard = async (flashcardId: string) => {
    try {
      const flashcardRef = doc(db, 'shared', flashcardId);
      await deleteDoc(flashcardRef);

      setSharedFlashcards(sharedFlashcards.filter(card => card.id !== flashcardId));

      console.log('Flashcard deleted successfully!');
    } catch (error) {
      console.error('Error deleting shared flashcard:', error);
    }
  };

  const openNote = (noteId: string) => {
    router.push(`/home/document/${noteId}`);
  };

  const deleteSharedNote = async (noteId: string) => {
    try {
      const noteRef = doc(db, 'shared_notes', noteId);
      await deleteDoc(noteRef);
      setSharedNotes(sharedNotes.filter(note => note.id !== noteId));
      setConfirmationMessage('Note supprimée avec succès');
    } catch (error) {
      console.error('Error deleting shared note:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email) {
          loadSharedContent(user.email);
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
      <h1 className="text-3xl font-bold mb-8 text-center">Contenu Partagé</h1>

      {confirmationMessage && (
        <div className="bg-green-100 text-green-700 p-4 mb-4 rounded-lg text-center">
          {confirmationMessage}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Flashcards Partagées</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
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
              <h2 className="text-lg font-bold text-center mb-4">{flashcard.name}</h2>

              <Button
                onClick={() => addFlashcardToMyPiles(flashcard)}
                className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 mb-2"
              >
                Add to My Piles
              </Button>

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

      <h2 className="text-2xl font-bold mb-4">Notes Partagées</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sharedNotes.map((note) => (
          <Card
            key={note.id}
            className="relative shadow-lg rounded-[15px] p-6 flex flex-col justify-between"
            style={{
              height: '200px',
              width: '260px',
              backgroundColor: '#f9f9f9',
              borderRadius: '15px',
            }}
          >
            <CardContent className="relative flex flex-col justify-center items-center">
              <h2 className="text-lg font-bold text-center mb-4">{note.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                Partagé le: {new Date(note.sharedAt).toLocaleDateString()}
              </p>

              <Button
                onClick={() => openNote(note.id)}
                className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 mb-2"
              >
                Ouvrir la note
              </Button>

              <Button
                onClick={() => deleteSharedNote(note.id)}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-800"
              >
                Supprimer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
