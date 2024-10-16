"use client"; // Indiquer que ce composant utilise le rendu côté client


import { useRouter } from 'next/navigation'; // Importation du hook useRouter pour la navigation
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Timer, Brain, Volume2, Zap, CheckCircle, PlayCircle, PauseCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useState, useEffect,useRef } from 'react';
import { User } from 'firebase/auth';



export default function LandingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter(); // Initialisation du router pour la navigation
  const audioRef = useRef<HTMLAudioElement>(null);
  const [user, setUser] = useState<User | null>(null);



  const toggleFlip = () => setIsFlipped(!isFlipped);
  
  const togglePlay = () => {
    if (audioRef.current) { // Check if audioRef.current is not null
      if (!isPlaying) {
        audioRef.current.play(); // Play the audio
      } else {
        audioRef.current.pause(); // Pause the audio
      }
      setIsPlaying(!isPlaying); // Toggle the playing state
    }
  };
  



  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Update the state with the current user or null if logged out
    });
  
    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  



  const handleNavigation = (path: string) => {
    router.push(path); // Use router.push() to navigate the user
  };
  

  const handleStartClick = () => {
    if (user) {
      router.push('/home'); // Redirige vers /home si l'utilisateur est connecté
    } else {
      router.push('/auth'); // Redirige vers /auth si l'utilisateur n'est pas connecté
    }
  };

  

  return (
    <div className="min-h-screen bg-background text-foreground">
       <audio ref={audioRef} src="/sounds/nature.mp3" preload="auto" />
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Flashmaster</h1>
            <div className="flex space-x-4">
              <Button variant="ghost" onClick={() => handleNavigation('/auth')}>Se connecter</Button>
              <Button variant="outline" onClick={() => handleNavigation('/auth')}>S&rsquo;inscrire</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Maîtrisez vos connaissances avec Flashmaster</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">La plateforme d&rsquo;apprentissage par flashcards 100% gratuite et avancée</p>
            <Button
  size="lg"
  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
  onClick={handleStartClick} // Utilisez la nouvelle fonction ici
>
  Commencer gratuitement
</Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Fonctionnalités principales (100% gratuites)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Brain className="w-8 h-8 text-primary" />}
                title="Flashcards intelligentes"
                extra={null} 
                description="Créez et organisez vos propres flashcards. Notre algorithme adapte votre apprentissage pour une mémorisation optimale."
              />
              <FeatureCard
                icon={<Timer className="w-8 h-8 text-primary" />}
                title="Pomodoro intégré"
                extra={null} 
                description="Optimisez vos sessions d&rsquo;étude avec notre minuteur Pomodoro intégré. Alternez travail focalisé et pauses pour une productivité maximale."
              />
              <FeatureCard
                icon={<Volume2 className="w-8 h-8 text-primary" />}
                title="Ambiances sonores"
                description="Plongez-vous dans l&rsquo;étude avec nos ambiances sonores apaisantes. Choisissez parmi une variété de sons pour améliorer votre concentration."
                extra={
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlay}
                  className="mt-2"
                >
                  {isPlaying ? (
                    <><PauseCircle className="mr-2 h-4 w-4" /> Pause</>
                  ) : (
                    <><PlayCircle className="mr-2 h-4 w-4" /> Play</>
                  )}
                </Button>
                }
              />
            </div>
          </div>
        </section>

        {/* Flashcard Demo Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">Découvrez nos flashcards interactives</h2>
            <div className="flex justify-center">
              <Card 
                className={`w-64 h-40 cursor-pointer transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                onClick={toggleFlip}
              >
                <CardContent className="flex items-center justify-center h-full">
                  {!isFlipped ? (
                    <p className="text-lg font-semibold">Quelle est la capitale de la France ?</p>
                  ) : (
                    <p className="text-lg font-semibold [transform:rotateY(180deg)]">Paris</p>
                  )}
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Cliquez sur la carte pour la retourner</p>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Comment ça marche</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Zap className="w-8 h-8 text-primary" />}
                title="1. Créez vos flashcards"
                extra={null} 
                description="Ajoutez facilement vos propres questions et réponses pour créer des flashcards personnalisées."
              />
              <FeatureCard
                icon={<Brain className="w-8 h-8 text-primary" />}
                title="2. Étudiez intelligemment"
                extra={null} 
                description="Utilisez le mode d&rsquo;étude pour réviser vos flashcards. Notre algorithme adapte la fréquence de révision pour une mémorisation optimale."
              />
              <FeatureCard
                icon={<CheckCircle className="w-8 h-8 text-primary" />}
                title="3. Suivez vos progrès"
                extra={null} 
                description="Visualisez vos performances et votre progression au fil du temps grâce à nos outils de suivi intégrés."
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Avantages de l&rsquo;apprentissage par flashcards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Mémorisation active", description: "Stimule la récupération active des informations, renforçant la mémoire à long terme." },
                { title: "Apprentissage espacé", description: "Optimise les intervalles de révision pour une rétention maximale des connaissances." },
                { title: "Feedback immédiat", description: "Permet une auto-évaluation instantanée, identifiant rapidement les points à améliorer." },
                { title: "Polyvalence", description: "Adaptées à de nombreux sujets, des langues aux sciences en passant par l&rsquo;histoire." },
                { title: "Personnalisation", description: "Créez des cartes sur mesure pour vos besoins spécifiques d&rsquo;apprentissage." },
                { title: "Apprentissage mobile", description: "Étudiez n&rsquo;importe où, n&rsquo;importe quand, sur tous vos appareils." }
              ].map((benefit, index) => (
                <Card key={index} className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Topics Section */}
        <section>
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Sujets populaires pour les flashcards</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Langues étrangères", "Vocabulaire", "Sciences", "Histoire",
                "Géographie", "Littérature", "Médecine", "Droit", "Informatique"
              ].map((topic, index) => (
                <Button key={index} variant="outline" className="m-1">
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
              {[
                { question: "Est-ce que Flashmaster est vraiment gratuit ?", answer: "Oui, Flashmaster est entièrement gratuit ! Toutes nos fonctionnalités sont accessibles sans frais." },
                { question: "Comment fonctionne le système Pomodoro ?", answer: "Le système Pomodoro intégré vous permet de définir des sessions d&rsquo;étude chronométrées, généralement de 25 minutes, suivies de courtes pauses. Cela aide à maintenir votre concentration et à optimiser votre productivité." },
                { question: "Puis-je utiliser Flashmaster sur mobile ?", answer: "Absolument ! Flashmaster est conçu pour être utilisé sur tous les appareils, y compris les smartphones et les tablettes. Vous pouvez étudier où que vous soyez." },
                { question: "Y a-t-il une limite au nombre de flashcards que je peux créer ?", answer: "Il n&rsquo;y a pas de limite au nombre de flashcards que vous pouvez créer. Vous êtes libre de créer autant de cartes que nécessaire pour votre apprentissage." },
                { question: "Puis-je partager mes flashcards avec d&rsquo;autres utilisateurs ?", answer: " Bien sur,le partage de flashcards est pas disponible vous vous entrainer a plusieurs" }
              ].map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Prêt à booster votre apprentissage gratuitement ?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">Rejoignez Flashmaster et commencez à apprendre plus efficacement dès aujourd&rsquo;hui, sans aucun frais !</p>
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handleNavigation('/auth')}>
              Commencer gratuitement
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-background py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Flashmaster. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  extra 
}: { 
  icon: JSX.Element, 
  title: string, 
  description: string, 
  extra?: JSX.Element | null 
}) {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-lg font-semibold leading-tight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground break-words">{description}</p>
        {extra && <div className="mt-2">{extra}</div>}
      </CardContent>
    </Card>
  );
}

