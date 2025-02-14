"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Clock, 
  Brain,
  BookOpen,
  Target,
  ArrowUpRight,
  Calendar,
  File
} from "lucide-react";
import { useRouter } from "next/navigation";
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Document {
  id: string;
  title: string;
  lastModified: Date;
}

interface QuickStats {
  totalDocuments: number;
  documentsThisWeek: number;
  averageScore: number;
  studyStreak: number;
}

interface StatData {
  date: string;
  pourcentage: number;
  timestamp: Date;
}

// Ajouter les couleurs harmonieuses
const cardColors = [
  {
    bg: "bg-gradient-to-br from-pink-600 via-pink-500 to-rose-600 hover:from-pink-700 hover:via-pink-600 hover:to-rose-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-pink-200 to-rose-200 text-pink-700 group-hover:from-pink-100 group-hover:to-rose-100",
    border: "border-pink-400/20 hover:border-pink-300/30"
  },
  {
    bg: "bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-purple-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-700 group-hover:from-indigo-100 group-hover:to-purple-100",
    border: "border-indigo-400/20 hover:border-indigo-300/30"
  },
  {
    bg: "bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 hover:from-violet-700 hover:via-violet-600 hover:to-purple-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-violet-200 to-purple-200 text-violet-700 group-hover:from-violet-100 group-hover:to-purple-100",
    border: "border-violet-400/20 hover:border-violet-300/30"
  },
  {
    bg: "bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-pink-600 hover:from-fuchsia-700 hover:via-fuchsia-600 hover:to-pink-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-fuchsia-200 to-pink-200 text-fuchsia-700 group-hover:from-fuchsia-100 group-hover:to-pink-100",
    border: "border-fuchsia-400/20 hover:border-fuchsia-300/30"
  },
  {
    bg: "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700",
    gradient: "from-white/10 via-white/5 to-black/20 group-hover:from-white/20 group-hover:via-white/10 group-hover:to-black/30",
    icon: "bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-700 group-hover:from-blue-100 group-hover:to-indigo-100",
    border: "border-blue-400/20 hover:border-blue-300/30"
  }
];

export default function Home() {
  const router = useRouter();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalDocuments: 0,
    documentsThisWeek: 0,
    averageScore: 0,
    studyStreak: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecentDocuments(user.uid);
        fetchQuickStats(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchRecentDocuments = async (uid: string) => {
    try {
      const docsRef = collection(db, `users/${uid}/documents`);
      const q = query(docsRef, orderBy("lastSaved", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Document data:", data); // Debug
        return {
          id: doc.id,
          title: data.title || "Document sans titre",
          lastModified: data.lastSaved ? new Date(data.lastSaved) : new Date()
        };
      });
      
      console.log("Documents récents:", documents); // Debug
      setRecentDocuments(documents);
    } catch (error) {
      console.error("Erreur lors de la récupération des documents récents:", error);
    }
  };

  const fetchQuickStats = async (uid: string) => {
    try {
      // Récupérer tous les documents
      const docsRef = collection(db, `users/${uid}/documents`);
      const docsSnapshot = await getDocs(docsRef);
      const allDocs = docsSnapshot.docs;
      console.log("Nombre total de documents:", allDocs.length); // Debug
      
      // Calculer les documents de cette semaine
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentDocs = allDocs.filter(doc => {
        const data = doc.data();
        const lastSaved = data.lastSaved ? new Date(data.lastSaved) : null;
        return lastSaved && lastSaved >= oneWeekAgo;
      });
      console.log("Documents cette semaine:", recentDocs.length); // Debug

      // Récupérer les statistiques
      const statsRef = collection(db, `users/${uid}/statistics`);
      const statsSnapshot = await getDocs(statsRef);
      const stats = statsSnapshot.docs.map(doc => doc.data());
      console.log("Statistiques brutes:", stats); // Debug

      // Calculer la moyenne des scores
      const scores = stats.map(stat => stat.pourcentage || 0);
      const averageScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;

      const statsData = stats.map(data => ({
        date: data.date,
        pourcentage: data.pourcentage || 0,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      }));

      const quickStats = {
        totalDocuments: allDocs.length,
        documentsThisWeek: recentDocs.length,
        averageScore: Math.round(averageScore),
        studyStreak: calculateStreak(statsData)
      };

      console.log("Statistiques calculées:", quickStats); // Debug
      setQuickStats(quickStats);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    }
  };

  const calculateStreak = (stats: StatData[]) => {
    let streak = 0;
    
    // Trier les stats par date
    const sortedStats = stats.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculer la série actuelle
    for (let i = 0; i < sortedStats.length; i++) {
      const currentDate = new Date(sortedStats[i].date);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toLocaleDateString() === expectedDate.toLocaleDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header avec recherche */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Gérez vos documents et suivez votre progression
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/home/create')} className="gap-2" size="lg">
              <Plus className="h-4 w-4" />
              Nouveau document
            </Button>
          </div>
        </div>

        {/* Quick Stats avec animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documents totaux</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.totalDocuments}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  +{quickStats.documentsThisWeek} cette semaine
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Brain className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.averageScore}%</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  Sur tous vos exercices
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Série d&apos;étude</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.studyStreak} jours</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  Continuez comme ça !
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documents récents</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.documentsThisWeek}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  Cette semaine
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents avec style amélioré */}
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">Documents récents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vos derniers documents modifiés
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/home/document')}
                className="gap-2"
              >
                <File className="h-4 w-4" />
                Voir tous les documents
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {recentDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentDocuments.map((doc, index) => {
                  const colorScheme = cardColors[index % cardColors.length];
                  return (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/home/document/${doc.id}`)}
                      className={`group relative overflow-hidden rounded-xl border-2 shadow-lg transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${colorScheme.bg} ${colorScheme.border}`}
                    >
                      {/* Effet de reflet métallique amélioré */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none opacity-75" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
                      
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-b ${colorScheme.gradient} transition-all duration-500`} />
                      
                      <div className="p-6 relative">
                        {/* Icon header */}
                        <div className="mb-4">
                          <div className={`p-3 rounded-xl w-fit transition-all duration-500 shadow-lg transform group-hover:scale-110 ${colorScheme.icon}`}>
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg line-clamp-1 text-white group-hover:text-white transition-colors">
                            {doc.title}
                          </h3>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-white/90">
                              <Calendar className="h-4 w-4" />
                              {formatDate(doc.lastModified)}
                            </div>
                          </div>
                        </div>

                        {/* Arrow icon avec animation */}
                        <div className="absolute top-4 right-4">
                          <ArrowUpRight className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-all duration-500 text-white transform group-hover:translate-x-1 group-hover:-translate-y-1`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4 bg-muted/30 rounded-lg border-2 border-dashed">
                <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="max-w-md mx-auto">
                  <p className="text-xl font-semibold">Aucun document récent</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Commencez à créer des documents pour les voir apparaître ici
                  </p>
                  <Button 
                    onClick={() => router.push('/home/create')} 
                    size="lg"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Créer un document
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}