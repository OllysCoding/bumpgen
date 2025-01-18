import {
  fetchAndParseXmlTv,
  getNextProgrammesForChannel,
  getValueForConfiguredLang,
} from "../xmltv/index.js";
import { failure, isFailure, isSuccess, unwrap } from "../result/index.js";
import { makeVideo } from "../video-generator/index.js";
import { appConfig, type ChannelConfig } from "../config/app.js";
import type { XmltvChannel, XmltvProgramme } from "@iptv/xmltv";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { Templates } from "../templates/index.js";
import { getFillLength } from "./helpers/getFillLength.js";
import { getBackgroundContentForChannel } from "./helpers/getBackgroundContentForChannel.js";
import { getChannelConfig } from "./helpers/getChannelConfig.js";
import { createProgrammeInfoFromProgrammes } from "../video-generator/helpers/createProgrammeInfoFromProgrammes.js";

const channelTask = async (
  channel: XmltvChannel,
  programmes: XmltvProgramme[],
  channelConfig: ChannelConfig,
): ReturnType<typeof makeVideo> => {
  const nextProgrammes = getNextProgrammesForChannel(channel, programmes);
  if (isFailure(nextProgrammes)) {
    return failure("Failed to get next programme", nextProgrammes.error);
  }

  const length =
    channelConfig.length === "*"
      ? getFillLength(nextProgrammes.result)
      : channelConfig.length;

  const programmeInfo = createProgrammeInfoFromProgrammes(
    nextProgrammes.result,
  );

  if (isFailure(programmeInfo)) {
    return failure("Failed to get overlay config", programmeInfo.error);
  }

  const backgroundContent = await getBackgroundContentForChannel(
    channelConfig,
    length,
  );
  if (isFailure(backgroundContent)) {
    return backgroundContent;
  }

  const template = Templates.getTemplateByName(channelConfig.template);
  if (isFailure(template)) {
    return template;
  }

  const resolution = channelConfig.resolution ?? {
    width: 1920,
    height: 1080,
  };

  return makeVideo({
    ...resolution,
    length,
    template: template.result,
    programmes: programmeInfo.result,
    outputDir: appConfig.config.outputFolder,
    outputFileName: `channel-${channel.id}.mp4`,
    channelInfo: {
      id: channel.id,
      name: unwrap(getValueForConfiguredLang(channel.displayName)),
    },
    background: backgroundContent.result,
  });
};

export default {
  getSchedule: () => `*/${appConfig.config.interval || 5} * * * *`,
  job: async () => {
    logInfo(`Starting main job...`);
    const xmlTv = await fetchAndParseXmlTv(appConfig.config.xmlTvUrl);
    if (isSuccess(xmlTv)) {
      for (const channel of xmlTv.result.channels) {
        const channelConfig = getChannelConfig(channel.id);
        if (!channelConfig) {
          logDebug(`Skipping channel ${channel.id}, no config available`);
          continue;
        }

        logInfo(`Started task for channel ${channel.id}`);
        const result = await channelTask(
          channel,
          xmlTv.result.programmes,
          channelConfig,
        );
        if (isFailure(result)) {
          logError(
            `Failed channel task for channel ${channel.id}`,
            result.error,
          );
        } else {
          logInfo(
            `Completed task for channel ${channel.id} (Video ${result.result.replace("-", " ")})`,
          );
        }
      }
    }
  },
};
