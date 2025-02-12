import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import Image from 'next/image';

export interface BackgroundSelectorProps {
    onSelect: (newBackground: string) => void;
    id?: string;  // Ajout de la prop id optionnelle
}

const backgrounds = [
    '/images/forest.jpg',
    '/images/foret3.jpg',
    '/images/foret2.jpg',
    '/images/foret4.jpg',
    '/images/foret5.jpg',
    '/images/foret6.jpg',
    '/images/ocean.jpg',
    '/images/rain.jpg',
    '/images/sea1.jpg',
    '/images/sea2.jpg',
    '/images/sea3.jpg',
    '/images/sea4.jpg',
    '/images/sea5.jpg',
    '/images/sea6.jpg',
    '/images/sea7.jpg',
    '/images/japon1.jpg',
    '/images/japon2.jpg',
    '/images/japon3.jpg',
    '/images/japon4.jpg',
    '/images/japon5.jpg',

];

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ onSelect, id }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button id={id} className="hidden">Fond</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full">
                <DialogHeader>
                    <DialogTitle>Choisir un arrière-plan</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                    {backgrounds.map((bg, index) => (
                        <div
                            key={bg}
                            className="aspect-video cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                            onClick={() => {
                                onSelect(bg);
                                const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
                                if (closeButton) closeButton.click();
                            }}
                        >
                            <Image
                                src={bg}
                                alt={`Background ${index + 1}`}
                                className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                width={300}
                                height={169}
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
