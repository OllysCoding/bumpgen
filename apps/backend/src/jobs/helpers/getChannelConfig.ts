import { appConfig, type ChannelConfig } from "../../config/app.js";

export const getChannelConfig = (
  channelId: string,
): ChannelConfig | undefined => {
  let defaultConfig: ChannelConfig | undefined = undefined;
  return (
    appConfig.config.channels.find((config) => {
      if (config.channelIds === "*") {
        defaultConfig = config;
        return false;
      } else {
        return config.channelIds.includes(channelId);
      }
    }) ?? defaultConfig
  );
};
