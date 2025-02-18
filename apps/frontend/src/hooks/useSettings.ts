import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { V1_API_BASE } from "../utils/constants";

export type Settings = {
  logLevel: "DEBUG" | "INFO" | "ERROR";
  language: string;
  experimentalPluginsSupport: boolean;
  interval: number;
  xmlTvUrl: string;
  outputFolder: string;
  backgroundContentFolder: string;
};

export type ChannelConfig = {
  backgroundContent: "*" | string[];
  channelIds: "*" | string[];
  template: string;
  length: number | "*";
  resolution: {
    width: number;
    height: number;
  };
};

export type BackgroundContentConfig = {
  windows: [number, number][];
};

const fetchAppSettings = async (): Promise<Settings> => {
  const response = await fetch(`${V1_API_BASE}/settings`);
  if (!response.ok) {
    throw Error("Failed to fetch app settings");
  }

  return (await response.json()) as Settings;
};
const updateAppSettings = async (newSettings: Settings): Promise<Settings> => {
  const response = await fetch(`${V1_API_BASE}/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newSettings),
  });

  if (!response.ok) {
    throw Error("Failed to initialize app");
  }

  return (await response.json()) as Settings;
};

const fetchChannelConfigs = async (): Promise<ChannelConfig[]> => {
  const response = await fetch(`${V1_API_BASE}/settings/channel-configs`);
  if (!response.ok) {
    throw Error("Failed to fetch channel configs");
  }

  return (await response.json()) as ChannelConfig[];
};

const fetchBackgroundContentConfigs = async (): Promise<
  Record<string, BackgroundContentConfig>
> => {
  const response = await fetch(
    `${V1_API_BASE}/settings/background-content-configs`,
  );
  if (!response.ok) {
    throw Error("Failed to fetch app background contnent");
  }

  return (await response.json()) as Record<string, BackgroundContentConfig>;
};

const updateBackgrountContentConfig = async (data: {
  filePath: string;
  backgroundContentConfig: BackgroundContentConfig;
}): Promise<Record<string, BackgroundContentConfig>> => {
  const response = await fetch(
    `${V1_API_BASE}/background-content-configs/update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw Error("Failed update background content config");
  }

  return (await response.json()) as Record<string, BackgroundContentConfig>;
};

const createBackgrountContentConfig = async (data: {
  filePath: string;
  backgroundContentConfig: BackgroundContentConfig;
}): Promise<Record<string, BackgroundContentConfig>> => {
  const response = await fetch(
    `${V1_API_BASE}/background-content-configs/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw Error("Failed create background content config");
  }

  return (await response.json()) as Record<string, BackgroundContentConfig>;
};

type UseSettings = () => {
  settings: Settings;
  updateSettings: (newSettings: Settings) => Promise<Settings>;
  settingsIsUpdating: boolean;

  channelConfigs: ChannelConfig[];

  backgroundContentConfigs: Record<string, BackgroundContentConfig>;
  updateBackgroundContentConfig: (data: {
    filePath: string;
    backgroundContentConfig: BackgroundContentConfig;
  }) => Promise<Record<string, BackgroundContentConfig>>;
  createBackgroundContentConfig: (data: {
    filePath: string;
    backgroundContentConfig: BackgroundContentConfig;
  }) => Promise<Record<string, BackgroundContentConfig>>;
  backgroundContentIsUpdating: boolean;
  backgroundContentIsCreating: boolean;
};

export const useSettings: UseSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings } = useSuspenseQuery({
    queryKey: ["settings"],
    queryFn: fetchAppSettings,
  });
  const { data: channelConfigs } = useSuspenseQuery({
    queryKey: ["channel-configs"],
    queryFn: fetchChannelConfigs,
  });
  const { data: backgroundContentConfigs } = useSuspenseQuery({
    queryKey: ["background-content-configs"],
    queryFn: fetchBackgroundContentConfigs,
  });

  const { mutateAsync: updateSettings, isPending: settingsIsUpdating } =
    useMutation({
      mutationFn: updateAppSettings,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
      },
    });

  const {
    mutateAsync: updateBackgroundContentConfig,
    isPending: backgroundContentIsUpdating,
  } = useMutation({
    mutationFn: updateBackgrountContentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["background-content-configs"],
      });
    },
  });
  const {
    mutateAsync: createBackgroundContentConfig,
    isPending: backgroundContentIsCreating,
  } = useMutation({
    mutationFn: createBackgrountContentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["background-content-configs"],
      });
    },
  });

  return {
    settings,
    updateSettings,
    settingsIsUpdating,
    channelConfigs,
    backgroundContentConfigs,
    updateBackgroundContentConfig,
    createBackgroundContentConfig,
    backgroundContentIsUpdating,
    backgroundContentIsCreating,
  };
};
