"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CloudRain, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

// List of images
const images = [
  "/images/forest.jpg?height=300&width=300",
  "/images/foret2.jpg?height=300&width=300",
  "/images/foret3.jpg?height=300&width=300",
  "/images/foret4.jpg?height=300&width=300",
  "/images/foret5.jpg?height=300&width=300",
  "/images/foret6.jpg?height=300&width=300",
  "/images/foret7.jpg?height=300&width=300",
  "/images/nature.jpg?height=300&width=300",
  "/images/zen.jpg?height=300&width=300",
  "/images/ocean.jpg?height=300&width=300",
  "/images/sea2.jpg?height=300&width=300",
  "/images/sea3.jpg?height=300&width=300",
  "/images/sea4.jpg?height=300&width=300",
  "/images/sea5.jpg?height=300&width=300",
  "/images/sea6.jpg?height=300&width=300",
  "/images/rain.jpg?height=300&width=300",
  "/images/japon1.jpg?height=300&width=300",
  "/images/japon2.jpg?height=300&width=300",
  "/images/japon3.jpg?height=300&width=300",
  "/images/japon4.jpg?height=300&width=300",
  "/images/japon5.jpg?height=300&width=300",
];

// List of images that should have rain effect by default
const rainImages = [
  "/images/rain.jpg?height=300&width=300",
  "/images/zen.jpg?height=300&width=300",
  "/images/tahiti.jpg?height=300&width=300",
];

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
}

const throttle = <T extends unknown[]>(func: (...args: T) => void, limit: number) => {
  let inThrottle: boolean;
  return function (...args: T) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Rain Effect Component
const RainEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Throttling the resize event to avoid excessive reflows
    const resizeCanvasThrottled = throttle(() => {
      resizeCanvas();
    }, 200);

    window.addEventListener("resize", resizeCanvasThrottled);
    resizeCanvas();

    const raindrops: RainDrop[] = [];
    for (let i = 0; i < 80; i++) {
      raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 5 + 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(174, 194, 224, 0.5)";
      ctx.lineWidth = 1;

      raindrops.forEach((drop) => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        if (drop.y > canvas.height) {
          drop.y = 0 - drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvasThrottled);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
};

// Main Component
export default function Component() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showRain, setShowRain] = useState(false);

  // Handle Image Click to toggle rain effect
  const handleImageClick = useCallback(
    (image: string) => {
      setSelectedImage(selectedImage === image ? null : image);
      setShowRain(rainImages.includes(image));
    },
    [selectedImage]
  );

  // Mémorisation de la grille d'images pour éviter les re-rendus inutiles
  const imageGrid = useMemo(() => {
    return images.map((image, index) => (
      <div
        key={index}
        className="aspect-square cursor-pointer"
        onClick={() => handleImageClick(image)}
      >
        <Image
          src={image}
          alt={`Image ${index + 1}`}
          className="w-full h-full object-cover rounded-lg"
          layout="responsive"
          width={300}  // Replace width with actual dimensions
          height={300} // Replace height with actual dimensions
          loading="lazy"  // Lazy load each image to improve performance
        />
      </div>
    ));
  }, [handleImageClick]);

  return (
    <div className="h-screen p-8 relative overflow-hidden">
      {/* Fullscreen Image with Rain Effect */}
      <div
        className={`absolute inset-0 ${
          selectedImage ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          backgroundImage: selectedImage ? `url(${selectedImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {selectedImage && showRain && <RainEffect />}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => handleImageClick(selectedImage!)}
        />
      </div>

      {/* Image Grid */}
      <div className="h-full flex flex-col">
        <div
          className={`grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto ${
            selectedImage ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ maxHeight: "calc(100vh - 64px)" }} // Subtract button height
        >
          {imageGrid} {/* Use the memoized grid */}
        </div>
      </div>

      {/* Button to toggle rain effect */}
      {selectedImage && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-10"
          onClick={() => setShowRain(!showRain)}
        >
          {showRain ? <CloudOff className="h-4 w-4" /> : <CloudRain className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}