import {
  fetchAndParseXmlTv,
  getNextProgrammeForChannel,
  getValueForConfiguredLang,
} from "../xmltv/index.js";
import { failure, isFailure, isSuccess, success, unwrap, type Result } from "../result/index.js";
import {
  createOverlayConfigFromProgramme,
  makeVideo,
} from "../video-generator/index.js";
import path from "node:path";
import { appConfig, type ChannelConfig } from "../config/app.js";
import type { XmltvChannel, XmltvProgramme } from "@iptv/xmltv";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { glob } from "glob";
import { Templates } from "../templates/index.js";

const getChannelConfig = (channelId: string): ChannelConfig | undefined => {
  return appConfig.channels[channelId] || appConfig.channels["*"] || undefined
}

const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

const getBackgroundContentForChannel = async (channelConfig: ChannelConfig): Promise<Result<string>> => {
  const allAvailableFiles = await glob(`${appConfig.backgroundContentFolder}/*`);
  if (allAvailableFiles.length === 0) {
    return failure('No background content available');
  }

  if (Array.isArray(channelConfig.backgroundContent)) {
    const filteredContent = allAvailableFiles.filter(name => channelConfig.backgroundContent.includes(name))
    if (filteredContent.length !== channelConfig.backgroundContent.length) {
      const missing = allAvailableFiles.filter(name => !channelConfig.backgroundContent.includes(name))
      logDebug('Some files configured for channel are missing from background contents folder: ', missing);
    }
    if (filteredContent.length === 0) {
      return failure('No background content available once filter is applied');
    }
    return success(pickRandom(filteredContent));
  } else {
    return success(pickRandom(allAvailableFiles));
  }
}

const channelTask = async (
  channel: XmltvChannel,
  programmes: XmltvProgramme[],
  channelConfig: ChannelConfig
): ReturnType<typeof makeVideo> => {
  const currentProgramme = getNextProgrammeForChannel(channel, programmes);
  if (isFailure(currentProgramme)) {
    return failure("Failed to get next programme", currentProgramme.error);
  }

  const overlay = createOverlayConfigFromProgramme(currentProgramme.result);
  if (isFailure(overlay)) {
    return failure("Failed to get overlay config", overlay.error);
  }

  const backgroundContentFilename = await getBackgroundContentForChannel(channelConfig);
  if (isFailure(backgroundContentFilename)) {
    return backgroundContentFilename;
  }

  const template = Templates.getTemplateByName(channelConfig.template)
  if (isFailure(template)) {
    return template;
  }

  return makeVideo({
    template: template.result,
    overlay: overlay.result,
    outputDir: appConfig.outputFolder,
    outputFileName: `channel-${channel.id}.mp4`,
    length: 20,
    channelInfo: {
      id: channel.id,
      name: unwrap(getValueForConfiguredLang(channel.displayName)),
    },
    background: {
      filePath: path.join(
        appConfig.backgroundContentFolder,
        backgroundContentFilename.result,
      ),
      startSeconds: 10,
      endSeconds: 2711,
    }
  });
};

export default async () => {
  logInfo(`Starting main job...`);
  const xmlTv = await fetchAndParseXmlTv(appConfig.xmlTvUrl);
  if (isSuccess(xmlTv)) {
    for (const channel of xmlTv.result.channels) {
      const channelConfig = getChannelConfig(channel.id);
      if (!channelConfig) {
        logDebug(`Skipping channel ${channel.id}, no config available`);
        continue;
      }

      logInfo(`Started task for channel ${channel.id}`);
      const result = await channelTask(channel, xmlTv.result.programmes, channelConfig);
      if (isFailure(result)) {
        logError(`Failed channel task for channel ${channel.id}`, result.error);
      } else {
        logInfo(
          `Completed task for channel ${channel.id} (Video ${result.result.replace("-", " ")})`,
        );
      }
    }
  }
};
