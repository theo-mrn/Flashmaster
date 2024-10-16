import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";  // Ensure Firebase is initialized properly

const data = [
  { goal: 1 },
  { goal: 2 },
  { goal: 3 },
  { goal: 4 },
  { goal: 5 },
  { goal: 6 },
  { goal: 7 },
];

interface SessionGoalSettingsProps {
  userId: string;
  currentGoal: number;
  onUpdateGoal: () => void;
}

export function SessionGoalSettings({
  userId,
  currentGoal,
  onUpdateGoal,
}: SessionGoalSettingsProps) {
  const [goal, setGoal] = React.useState(currentGoal || 5);  // Default to 5 sessions per week
  const [isSubmitting, setIsSubmitting] = React.useState(false);  // Submission loading state
  const [drawerOpen, setDrawerOpen] = React.useState(false);  // Control drawer visibility

  function onClick(adjustment: number) {
    // Ensure the goal stays between 1 and 7 sessions per week
    setGoal(Math.max(1, Math.min(7, goal + adjustment)));
  }

  // Function to handle submitting the goal and closing the drawer
  const handleSubmit = async () => {
    if (!userId) {
      console.error("No userId available.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the user's session goal in Firestore
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        objectifHebdo: goal,
      });

      console.log("Goal updated successfully in Firestore.");

      // Call the onUpdateGoal function to refresh statistics in parent component
      if (typeof onUpdateGoal === "function") {
        onUpdateGoal();  // This will trigger the parent component to fetch the updated data
      }

      // Close the drawer after successfully updating the goal
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error updating goal: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Set Weekly Goal</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Objectif</DrawerTitle>
            <DrawerDescription>Mettre a jour mon objectif</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(-1)}
                disabled={goal <= 1}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">
                  {goal}
                </div>
                <div className="text-[0.70rem] uppercase text-muted-foreground">
                  Sessions par semaine
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(1)}
                disabled={goal >= 7}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className="mt-3 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <Bar
                    dataKey="goal"
                    style={{
                      fill: "hsl(var(--foreground))",
                      opacity: 0.9,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Valider"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Annuler</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

