import { getAllTags, getExerciseTagsPerGroup } from "@/api/tags";
import React, { createContext, useState, useEffect, ReactNode } from "react";

interface Tag {
  id: string;
  name: string;
}

interface TagsContextType {
  tags: Tag[];
  exerciseTagsPerGroup: any;
  fetchTags: () => Promise<void>;
  fetchExerciseTagsPerGroup: () => Promise<void>;

}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider = ({ children }: { children: ReactNode }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [exerciseTagsPerGroup, setExerciseTagsPerGroup] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // To manage loading state
  const [error, setError] = useState<string | null>(null); // To manage errors

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const tagsData = await getAllTags();
      if (tagsData) {
        setTags(tagsData);
      } else {
        setError("Failed to load tags");
      }
    } catch (err) {
      setError("An error occurred while fetching tags");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseTagsPerGroup = async () => {
    setLoading(true);
    setError(null);
    try {
      const tagsData = await getExerciseTagsPerGroup();
      if (tagsData) {
        setExerciseTagsPerGroup(tagsData);
      } else {
        setError("Failed to load tags");
      }
    } catch (err) {
      setError("An error occurred while fetching tags");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //   useEffect(() => {
  //     fetchTags();
  //   }, []);

  return (
    <TagsContext.Provider
      value={{
        tags,
        fetchTags,
        exerciseTagsPerGroup,
        fetchExerciseTagsPerGroup,
      }}
    >
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => {
  const context = React.useContext(TagsContext);
  if (!context) {
    throw new Error("useTags must be used within a TagsProvider");
  }
  return context;
};
