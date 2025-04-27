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

const getWrapper = async <T>({
  path,
  errMessage,
}: {
  path: string;
  errMessage: string;
}): Promise<T> => {
  const response = await fetch(`${V1_API_BASE}${path}`);
  if (!response.ok) {
    throw Error(errMessage);
  }

  return (await response.json()) as T;
};

const postWrapper = async <T>({
  path,
  errMessage,
  body,
}: {
  path: string;
  errMessage: string;
  body: unknown;
}): Promise<T> => {
  const response = await fetch(`${V1_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw Error(errMessage);
  }

  return (await response.json()) as T;
};

const fetchAppSettings = async (): Promise<Settings> =>
  getWrapper({
    path: "/settings",
    errMessage: "Failed to fetch app settings",
  });

const updateAppSettings = async (newSettings: Settings): Promise<Settings> =>
  postWrapper({
    path: "/settings",
    errMessage: "Failed to update settings",
    body: newSettings,
  });

const fetchChannelConfigs = async (): Promise<ChannelConfig[]> =>
  getWrapper({
    path: "/settings/channel-configs",
    errMessage: "Failed to fetch app channel configs",
  });

const updateChannelConfigFn = async (data: {
  index: number;
  channelConfig: ChannelConfig;
}): Promise<ChannelConfig[]> =>
  postWrapper({
    path: "/settings/channel-configs/update",
    errMessage: "Failed update channel config",
    body: data,
  });

const deleteChannelConfigFn = async (index: number): Promise<ChannelConfig[]> =>
  postWrapper({
    path: "/settings/channel-configs/delete",
    errMessage: "Failed delete channel config",
    body: { index },
  });

const createChannelConfigFn = async (
  config: ChannelConfig,
): Promise<ChannelConfig[]> =>
  postWrapper({
    path: "/settings/channel-configs/create",
    errMessage: "Failed create channel config",
    body: config,
  });

const fetchBackgroundContentConfigs = async (): Promise<
  Record<string, BackgroundContentConfig>
> =>
  getWrapper({
    path: "/settings/background-content-configs",
    errMessage: "Failed to fetch app background content",
  });

const updateBackgroundContentConfigFn = async (data: {
  filePath: string;
  backgroundContentConfig: BackgroundContentConfig;
}): Promise<Record<string, BackgroundContentConfig>> =>
  postWrapper({
    path: "/settings/background-content-configs/update",
    errMessage: "Failed update background content config",
    body: data,
  });

const deleteBackgroundContentConfigFn = async (data: {
  filePath: string;
}): Promise<Record<string, BackgroundContentConfig>> =>
  postWrapper({
    path: "/settings/background-content-configs/delete",
    errMessage: "Failed delete background content config",
    body: data,
  });

const createBackgrountContentConfigFn = async (data: {
  filePath: string;
  backgroundContentConfig: BackgroundContentConfig;
}): Promise<Record<string, BackgroundContentConfig>> =>
  postWrapper({
    path: "/settings/background-content-configs/create",
    errMessage: "Failed create background content config",
    body: data,
  });

type UseSettings = () => {
  settings: Settings;
  updateSettings: (newSettings: Settings) => Promise<Settings>;
  settingsIsUpdating: boolean;

  channelConfigs: ChannelConfig[];
  updateChannelConfig: (data: {
    index: number;
    channelConfig: ChannelConfig;
  }) => Promise<ChannelConfig[]>;
  createChannelConfig: (data: ChannelConfig) => Promise<ChannelConfig[]>;
  deleteChannelConfig: (index: number) => Promise<ChannelConfig[]>;
  channelConfigIsUpdating: boolean;
  channelConfigIsCreating: boolean;
  channelConfigIsDeleting: boolean;

  backgroundContentConfigs: Record<string, BackgroundContentConfig>;
  updateBackgroundContentConfig: (data: {
    filePath: string;
    backgroundContentConfig: BackgroundContentConfig;
  }) => Promise<Record<string, BackgroundContentConfig>>;
  createBackgroundContentConfig: (data: {
    filePath: string;
    backgroundContentConfig: BackgroundContentConfig;
  }) => Promise<Record<string, BackgroundContentConfig>>;
  deleteBackgroundContentConfig: (data: {
    filePath: string;
  }) => Promise<Record<string, BackgroundContentConfig>>;
  backgroundContentIsUpdating: boolean;
  backgroundContentIsCreating: boolean;
  backgroundContentIsDeleting: boolean;
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
    mutateAsync: updateChannelConfig,
    isPending: channelConfigIsUpdating,
  } = useMutation({
    mutationFn: updateChannelConfigFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["channel-configs"],
      });
    },
  });

  const {
    mutateAsync: updateBackgroundContentConfig,
    isPending: backgroundContentIsUpdating,
  } = useMutation({
    mutationFn: updateBackgroundContentConfigFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["background-content-configs"],
      });
    },
  });

  const {
    mutateAsync: createChannelConfig,
    isPending: channelConfigIsCreating,
  } = useMutation({
    mutationFn: createChannelConfigFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["channel-configs"],
      });
    },
  });

  const {
    mutateAsync: createBackgroundContentConfig,
    isPending: backgroundContentIsCreating,
  } = useMutation({
    mutationFn: createBackgrountContentConfigFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["background-content-configs"],
      });
    },
  });

  const {
    mutateAsync: deleteChannelConfig,
    isPending: channelConfigIsDeleting,
  } = useMutation({
    mutationFn: deleteChannelConfigFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["channel-configs"],
      });
    },
  });

  const {
    mutateAsync: deleteBackgroundContentConfig,
    isPending: backgroundContentIsDeleting,
  } = useMutation({
    mutationFn: deleteBackgroundContentConfigFn,
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
    updateChannelConfig,
    createBackgroundContentConfig,
    createChannelConfig,
    deleteBackgroundContentConfig,
    deleteChannelConfig,
    backgroundContentIsUpdating,
    channelConfigIsUpdating,
    backgroundContentIsCreating,
    channelConfigIsCreating,
    backgroundContentIsDeleting,
    channelConfigIsDeleting,
  };
};
