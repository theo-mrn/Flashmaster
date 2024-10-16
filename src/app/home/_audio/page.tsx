import AudioPlayer from "@/components/ui/AudioPlayer"; // Chemin vers le composant AudioPlayer

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-4xl w-full p-6">
        <h1 className="text-4xl font-bold text-center mb-8">Relaxing Sounds</h1>

        {/* Utilisation du composant AudioPlayer */}
        <AudioPlayer />
      </div>
    </div>
  );
}
