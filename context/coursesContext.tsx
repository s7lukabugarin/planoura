import { getAllCourses } from "@/api/courses";
import { Exercise, getAllExercices } from "@/api/exercices";
import { getAllTags } from "@/api/tags";
import React, { createContext, useState, useEffect, ReactNode } from "react";

interface CoursesContextType {
  courses: any[];
  fetchCourses: () => Promise<void>;
  loading: boolean;
}

const CoursesContext = createContext<CoursesContextType | undefined>(
  undefined
);

export const CoursesProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesData = await getAllCourses();
      if (coursesData) {
        setCourses(coursesData);
      } else {
        setError("Failed to load courses");
      }
    } catch (err) {
      setError("An error occurred while fetching courses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <CoursesContext.Provider value={{ courses, fetchCourses, loading }}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => {
  const context = React.useContext(CoursesContext);
  if (!context) {
    throw new Error("useTags must be used within a CoursesProvider");
  }
  return context;
};
