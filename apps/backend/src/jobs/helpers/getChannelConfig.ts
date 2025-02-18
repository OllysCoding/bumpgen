import { Container } from "typedi";
import {
  AppConfigService,
  type ChannelConfig,
} from "../../services/AppConfigService.js";

export const getChannelConfig = (
  channelId: string,
): ChannelConfig | undefined => {
  let defaultConfig: ChannelConfig | undefined = undefined;
  return (
    Container.get(AppConfigService).config.channels.find((config) => {
      if (config.channelIds === "*") {
        defaultConfig = config;
        return false;
      } else {
        return config.channelIds.includes(channelId);
      }
    }) ?? defaultConfig
  );
};
