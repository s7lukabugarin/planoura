import { Exercise, getAllExercices } from "@/api/exercices";
import { getAllTags } from "@/api/tags";
import React, { createContext, useState, useEffect, ReactNode } from "react";

// export interface Exercise {
//   id: number;
//   name: string;
//   description: string;
//   exercise_tags: ExerciseTag[];
//   created_at: string;
//   updated_at: string;
//   created_by: number;
//   is_active: boolean;
//   is_public: boolean;
//   videos: Video[];
//   duration_in_seconds: number;
// }

interface ExerciseTag {
  id: string;
  name: string;
}

interface Video {
  file_path: string;
}

interface ExercisesContextType {
  exercises: Exercise[];
  fetchExercises: () => Promise<void>;
  loading: boolean;
}

const ExercisesContext = createContext<ExercisesContextType | undefined>(
  undefined
);

export const ExercisesProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const exercisesData = await getAllExercices();
      if (exercisesData) {
        setExercises(exercisesData);
      } else {
        setError("Failed to load tags");
      }
    } catch (err) {
      setError("An error occurred while fetching exercises");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //   useEffect(() => {
  //     fetchTags();
  //   }, []);

  return (
    <ExercisesContext.Provider value={{ exercises, fetchExercises, loading }}>
      {children}
    </ExercisesContext.Provider>
  );
};

export const useExercises = () => {
  const context = React.useContext(ExercisesContext);
  if (!context) {
    throw new Error("useTags must be used within a ExercisesProvider");
  }
  return context;
};
