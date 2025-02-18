import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { V1_API_BASE } from "../utils/constants";

export type CacheData = {
  channels: { name: string; id: string }[];
  backgroundContent: {
    fullPath: string;
    relativePath: string;
    length?: number;
  }[];
  templates: { name: string }[];
};

const fetchAppCache = async (): Promise<CacheData> => {
  const response = await fetch(`${V1_API_BASE}/cache`);
  if (!response.ok) {
    throw Error("Failed to fetch app cache");
  }

  return (await response.json()) as CacheData;
};

type UseCache = () =>
  | {
      status: "success";
      data: CacheData;
    }
  | { status: "loading" }
  | { status: "error" };

export const useCache: UseCache = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["cache"],
    queryFn: fetchAppCache,
    refetchInterval: (query) =>
      query.state.data === undefined ? 5_000 : 60_000,
  });

  if (data) {
    return {
      status: "success",
      data,
    };
  } else if (isLoading) {
    return {
      status: "loading",
    };
  }

  return { status: "error" };
};

type UseSuspenseCache = () => CacheData;

export const useSuspenseCache: UseSuspenseCache = () => {
  const { data } = useSuspenseQuery({
    queryKey: ["cache"],
    queryFn: fetchAppCache,
    refetchInterval: (query) =>
      query.state.data === undefined ? 5_000 : 60_000,
  });

  return data;
};
