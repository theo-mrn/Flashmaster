'use client'

import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';

// Define a Track interface to describe the structure of a track
interface Track {
  id: number;
  title: string;
  src: string;
}

interface AudioContextType {
  currentTrack: Track;
  isPlaying: boolean;
  volume: number;
  togglePlay: () => void;
  setTrack: (track: Track) => void;
  setVolume: (value: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track>({ id: 1, title: "Méditation zen", src: "/sounds/zen.mp3" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const setTrack = (track: Track) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.play();
    }
    setIsPlaying(true);
  };

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, volume, togglePlay, setTrack, setVolume }}>
      {children}
      <audio ref={audioRef} src={currentTrack.src} />
    </AudioContext.Provider>
  );
}
