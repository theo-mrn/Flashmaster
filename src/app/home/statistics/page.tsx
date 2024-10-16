'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowUp, Book, Trophy, Brain, Target, ChevronLeft, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SessionGoalSettings } from "@/components/ui/SessionGoalSettings";

// Définition du type pour les éléments de statsArray
type Stat = {
  date: string;
  pourcentage: number;
  cartesApprises?: number;
};

// Fonction pour générer les données du mois pour le calendrier
function generateMonthData(year: number, month: number, statsArray: Stat[]) {
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Nombre de jours dans le mois
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1).toLocaleDateString('fr-CA');  // Format de date pour correspondre aux stats
    const studied = statsArray.some(stat => stat.date === date);  // Vérifier si une session d'étude a eu lieu ce jour-là
    return {
      date: new Date(year, month, i + 1),  // La date du jour
      studied  // Indiquer si l'utilisateur a étudié ce jour-là
    };
  });
}

// Fonction pour calculer le niveau global
const calculateGlobalLevel = (statsArray: Stat[]): number => {
  if (statsArray.length === 0) return 0;
  
  const totalPercentage = statsArray.reduce((sum, stat) => sum + stat.pourcentage, 0);
  return Math.round(totalPercentage / statsArray.length);
};

// Fonction pour calculer les progrès hebdomadaires
const calculateWeeklyProgress = (statsArray: Stat[]): number => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return statsArray.filter(stat => new Date(stat.date) >= oneWeekAgo).length;
};

// Fonction pour calculer les meilleures performances
const calculateBestPerformance = (statsArray: Stat[]) => {
  let longestStreak = 0;
  let currentStreak = 0;
  let bestScore = 0;
  let mostCardsInOneDay = 0;
  let lastDate: Date | null = null;

  statsArray.forEach(stat => {
    const currentDate = new Date(stat.date);
    if (lastDate && (currentDate.getTime() - lastDate.getTime()) === 86400000) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    bestScore = Math.max(bestScore, stat.pourcentage);
    mostCardsInOneDay = Math.max(mostCardsInOneDay, stat.cartesApprises || 0);
    lastDate = currentDate;
  });

  return {
    longestStreak,
    bestScore: Math.round(bestScore),
    mostCardsInOneDay
  };
};

// Composant principal pour afficher les statistiques
export default function StatistiquesApprentissageBento() {
  const [userId, setUserId] = useState<string>('');
  const [statistics, setStatistics] = useState({
    pourcentageAujourdhui: 0,
    pourcentageDerniereSession: 0,
    cartesApprisesAujourdhui: 0,
    niveauGlobal: 0,
    evolutionData: [] as { date: number, pourcentage: number }[],
    currentProgress: 0,  // Progression actuelle (nombre de jours/sessions complétés)
    objectifHebdo: 7,    // Objectif hebdomadaire (par défaut : 7 jours)
    bestPerformance: {
      longestStreak: 0,
      bestScore: 0,
      mostCardsInOneDay: 0
    }
  });
  const [monthData, setMonthData] = useState<{ date: Date, studied: boolean }[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fonction pour récupérer les statistiques de l'utilisateur à partir de Firebase
  const fetchStatistics = async (userUid: string) => {
    try {
      // Récupérer les données des statistiques depuis Firestore
      const statsCollection = collection(db, `users/${userUid}/statistics`);
      const statsSnapshot = await getDocs(query(statsCollection, orderBy("timestamp", "asc")));
      const statsArray = statsSnapshot.docs.map(doc => doc.data() as Stat);

      // Récupérer le document utilisateur pour obtenir l'objectif hebdomadaire
      const userDocRef = doc(db, `users/${userUid}`);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      // Si aucune statistique n'est trouvée, définir un objectif par défaut de 7 jours
      const objectifHebdo = userData?.objectifHebdo || 7;

      // Calculer les statistiques d'aujourd'hui
      const today = new Date().toLocaleDateString('fr-CA');
      const todayStats = statsArray.find(stat => stat.date === today);
      const lastSessionStats = statsArray[statsArray.length - 2] || {};

      // Mettre à jour les statistiques dans l'état
      setStatistics({
        pourcentageAujourdhui: todayStats?.pourcentage || 0,
        pourcentageDerniereSession: lastSessionStats?.pourcentage || 0,
        cartesApprisesAujourdhui: todayStats?.cartesApprises || 0,
        niveauGlobal: calculateGlobalLevel(statsArray),
        evolutionData: statsArray.map(stat => ({
          date: new Date(stat.date).getDate(),
          pourcentage: stat.pourcentage
        })),
        currentProgress: calculateWeeklyProgress(statsArray),
        objectifHebdo,
        bestPerformance: calculateBestPerformance(statsArray)
      });

      // Générer les données pour la vue du calendrier
      setMonthData(generateMonthData(currentMonth.getFullYear(), currentMonth.getMonth(), statsArray));

    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Gestion de l'authentification et récupération des statistiques
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchStatistics(user.uid);  // Récupérer les statistiques après avoir défini l'ID utilisateur
      } else {
        setUserId('');  // Si l'utilisateur se déconnecte, réinitialiser l'ID utilisateur
      }
    });

    return () => unsubscribe();
  }, [currentMonth, userId]);

  // Changer de mois
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <div className="p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6">Mes statistiques</h1>
      <div className="grid grid-cols-4 gap-3">

        {/* Calendrier */}
        <Card className="col-span-2 row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mes séssions</span>
              <div className="flex items-center space-x-2">
                <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-200">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                  {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-200">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
                <div key={`day-${day}`} className="text-center font-medium text-sm">{day}</div>
              ))}
              {monthData.map((day) => (
                <div
                  key={`day-${day.date.toISOString()}`}
                  className={`h-8 rounded-md flex items-center justify-center text-sm ${
                    day.studied ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Graphique de l'évolution du pourcentage de réussite */}
        <Card className="col-span-2 row-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Évolution du pourcentage de réussite</CardTitle>
          </CardHeader>
          <CardContent className="w-full max-w-full">
            {statistics.evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={statistics.evolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    key="line-pourcentage"
                    type="monotone"
                    dataKey="pourcentage"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>Aucune donnée disponible pour afficher le graphique.</p>
            )}
          </CardContent>
        </Card>

        {/* Autres cartes */}
        {/* Réussite aujourd'hui */}
        <Card className="col-span-1 row-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réussite aujourd&apos;hui</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pourcentageAujourdhui}%</div>
            <p className="text-xs text-muted-foreground">
              +{statistics.pourcentageAujourdhui - statistics.pourcentageDerniereSession}% par rapport à la dernière session
            </p>
          </CardContent>
        </Card>

        {/* Cartes apprises aujourd'hui */}
        <Card className="col-span-1 row-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartes apprises aujourd&apos;hui</CardTitle>
            <Book className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.cartesApprisesAujourdhui}</div>
          </CardContent>
        </Card>

        {/* Niveau global */}
        <Card className="col-span-2 row-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niveau global</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.niveauGlobal}%</div>
            <Progress value={statistics.niveauGlobal} className="mt-2" />
          </CardContent>
        </Card>

        {/* Objectif hebdomadaire */}
        <Card className="col-span-2 row-span-1 h-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif hebdomadaire</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.currentProgress}/{statistics.objectifHebdo} jours
            </div>
            <Progress value={(statistics.currentProgress / statistics.objectifHebdo) * 100} className="mt-2" />
            <SessionGoalSettings
              userId={userId}
              currentGoal={statistics.objectifHebdo}
              onUpdateGoal={() => fetchStatistics(userId)}  // Actualiser après la mise à jour de l'objectif
            />
          </CardContent>
        </Card>

        {/* Meilleures performances */}
        <Card className="col-span-2 row-span-1 h-[200px]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              Meilleures performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-base">
              <li className="flex justify-between items-center">
                <span>Série la plus longue</span>
                <span className="font-bold">{statistics.bestPerformance.longestStreak} jours</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Meilleur score quotidien</span>
                <span className="font-bold">{statistics.bestPerformance.bestScore}%</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Plus de cartes en une journée</span>
                <span className="font-bold">{statistics.bestPerformance.mostCardsInOneDay} cartes</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
