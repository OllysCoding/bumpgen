import { failure, isFailure, isSuccess, unwrap } from "../result/index.js";
import { makeVideo } from "../video-generator/index.js";
import type { XmltvChannel } from "@iptv/xmltv";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { getFillLength } from "./helpers/getFillLength.js";
import { getBackgroundContentForChannel } from "./helpers/getBackgroundContentForChannel.js";
import { getChannelConfig } from "./helpers/getChannelConfig.js";
import { createProgrammeInfoFromProgrammes } from "../video-generator/helpers/createProgrammeInfoFromProgrammes.js";
import {
  AppConfigService,
  type ChannelConfig,
} from "../services/AppConfigService.js";
import { Container } from "typedi";
import { XmlTvService } from "../services/XmlTvService.js";
import { BackgroundContentService } from "../services/BackgroundContentService.js";
import { TemplatesService } from "../services/TemplatesService.js";
import { LiveStatsService } from "../services/LiveStatsService.js";

const channelTask = async (
  channel: XmltvChannel,
  channelConfig: ChannelConfig,
): ReturnType<typeof makeVideo> => {
  const nextProgrammes =
    Container.get(XmlTvService).getNextProgrammesForChannel(channel);
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

  const template = Container.get(TemplatesService).getTemplateByName(
    channelConfig.template,
  );
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
    outputDir: Container.get(AppConfigService).config.outputFolder,
    outputFileName: `channel-${channel.id}.mp4`,
    channelInfo: {
      id: channel.id,
      name: unwrap(
        Container.get(XmlTvService).getValueForConfiguredLang(
          channel.displayName,
        ),
      ),
    },
    background: backgroundContent.result,
    onGenerateStart: () =>
      Container.get(LiveStatsService).running(channel.id, "generating"),
  });
};

export default {
  getSchedule: () =>
    `*/${Container.get(AppConfigService).config.interval} * * * *`,
  job: async () => {
    logInfo(`Starting main job...`);
    const liveStatsService = Container.get(LiveStatsService);
    liveStatsService.start();

    const xmlTvResult = await Container.get(XmlTvService).run();
    if (isSuccess(xmlTvResult)) {
      // const backgroundContentResult = await cacheAllBackgroundContent();
      const backgroundContentResult = await Container.get(
        BackgroundContentService,
      ).run();
      if (isFailure(backgroundContentResult)) {
        logInfo(
          "Failed to fetch background content, will attempt to use existing items from cache",
          backgroundContentResult.error,
        );
      }

      for (const channel of Container.get(XmlTvService).channels) {
        liveStatsService.running(channel.id, "starting");
        const channelConfig = getChannelConfig(channel.id);
        if (!channelConfig) {
          logDebug(`Skipping channel ${channel.id}, no config available`);
          liveStatsService.channelResult(channel.id, 0, "not-configured");
          continue;
        }

        logInfo(`Started task for channel ${channel.id}`);
        const result = await channelTask(channel, channelConfig);
        if (isFailure(result)) {
          logError(
            `Failed channel task for channel ${channel.id}`,
            result.error,
          );
          liveStatsService.channelResult(channel.id, 0, "error");
        } else {
          const resultString =
            result.result === "generated" ? "generated" : "up-to-date";
          liveStatsService.channelResult(channel.id, 0, resultString);

          logInfo(
            `Completed task for channel ${channel.id} (Video ${result.result.replace("-", " ")})`,
          );
        }
      }

      liveStatsService.waiting();
    }
  },
};
