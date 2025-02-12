'use client'

import { useAudio } from "@/components/ui/audioContext";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from 'react';

const tracks = [
  { id: 1, title: "Méditation zen", src: "/sounds/zen.mp3", image: "/images/zen.jpg" },
  { id: 2, title: "Sons de la nature", src: "/sounds/nature.mp3", image: "/images/nature.jpg" },
  { id: 3, title: "Pluie douce", src: "/sounds/rain.mp3", image: "/images/rain.jpg" },
  { id: 4, title: "Océan calme", src: "/sounds/ocean.mp3", image: "/images/ocean.jpg" },
  { id: 5, title: "Forêt apaisante", src: "/sounds/forest.mp3", image: "/images/forest.jpg" },
  { id: 6, title: "Son de baleines", src: "/sounds/baleines.mp3", image: "/images/sea4.jpg" },

];

type Track = {
  id: number;
  title: string;
  src: string;
  image: string;
};

export default function AudioPlayer() {
  const { currentTrack, isPlaying, togglePlay, setTrack } = useAudio();
  const [volume, setVolume] = useState(0.5); // Volume initialisé à 50%
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Gestion du changement de volume avec audioRef
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume; // Appliquer le volume à l'élément audio
    }
  }, [volume]); // Réagir chaque fois que le volume change

  // Fonction pour changer de piste
  const handleTrackChange = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.src;
      audioRef.current.load(); // Préparer la piste

      // Lecture automatique lorsque la piste est prête
      audioRef.current.oncanplaythrough = () => {
        setTrack(track);
        audioRef.current?.play().catch((error) => {
          console.error("Erreur lors de la lecture:", error);
        });
      };

      audioRef.current.onerror = () => {
        console.error("Erreur de chargement de la piste");
      };
    }
  };

  // Fonction pour basculer entre lecture et pause
  const handleTogglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      togglePlay(); // Met à jour l'état de lecture global
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`border rounded-[30px] p-4 shadow-lg aspect-square ${currentTrack?.id === track.id ? 'bg-blue-100' : 'bg-white'}`}
            style={{ borderRadius: '30px' }} // Style squircle
            onClick={() => handleTrackChange(track)} // Sélection de la piste au clic
          >
            {/* Image de la carte */}
            <div className="w-full h-full relative mb-4">
              <Image
                src={track.image}
                alt={track.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="rounded-[30px]"
              />
            </div>

            {/* Titre de la piste */}
            <h2 className="text-xl font-semibold mb-2 text-gray-800">{track.title}</h2>
          </div>
        ))}
      </div>

      {/* Slider général pour le volume et bouton Play/Pause */}
      <div className="mt-6 w-full max-w-lg flex items-center justify-between space-x-4">
        <h3 className="text-lg font-semibold">Volume</h3>

        <div className="flex items-center w-full">
          <Slider
            value={[volume * 100]} // Contrôle global du volume
            onValueChange={(value) => setVolume(value[0] / 100)} // Met à jour le volume
            max={100}
            step={1}
            className="flex-grow" // Pour occuper l'espace disponible
          />
        </div>

        {/* Bouton Play/Pause général */}
        <Button onClick={handleTogglePlayPause} variant="ghost" size="icon" className="ml-4">
          {isPlaying ? (
            <PauseCircle className="h-10 w-10" /> // Augmenter la taille du bouton
          ) : (
            <PlayCircle className="h-10 w-10" /> // Augmenter la taille du bouton
          )}
        </Button>
      </div>

      {/* Élément audio invisible pour gérer la lecture */}
      <audio
        ref={audioRef}
        onEnded={() => audioRef.current?.play()} // Boucle sur la piste
        onError={() => {
          console.error("Erreur lors de la lecture de l'audio");
        }}
      />
    </div>
  );
}
