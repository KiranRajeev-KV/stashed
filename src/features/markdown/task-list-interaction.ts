import { createContext } from "react";

type TaskListInteraction = {
  disabled: boolean;
  onToggle: (markdown: string) => void;
};

export const TaskListInteractionContext =
  createContext<TaskListInteraction | null>(null);
