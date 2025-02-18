import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { V1_API_BASE } from "../utils/constants";

type IsInitializedResponse = {
  isInitialized: boolean;
};

const fetchIsAppInitialized = async (): Promise<boolean> => {
  const response = await fetch(`${V1_API_BASE}/initialize`);
  if (!response.ok) {
    throw Error("Failed to fetch whether app is initialized");
  }

  const data = (await response.json()) as IsInitializedResponse;

  return data.isInitialized;
};

export type InitializeData = {
  xmlTvUrl: string;
  language: string;
  outputFolder: string;
  backgroundContentFolder: string;
};

const initializeApp = async (data: InitializeData): Promise<void> => {
  const response = await fetch(`${V1_API_BASE}/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw Error("Failed to initialize app");
  }
};

type UseAppInitialization = () => {
  isInitialized: boolean;
  initialize: (data: InitializeData) => Promise<void>;
  isInitializing: boolean;
};

export const useAppInitialization: UseAppInitialization = () => {
  const queryClient = useQueryClient();
  const { data: isInitialized } = useSuspenseQuery({
    queryKey: ["isInitialized"],
    queryFn: fetchIsAppInitialized,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: initializeApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isInitialized"] });
    },
  });

  return {
    isInitialized,
    initialize: mutateAsync,
    isInitializing: isPending,
  };
};
