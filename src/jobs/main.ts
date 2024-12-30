import {
  fetchAndParseXmlTv,
  getNextProgrammeForChannel,
  getValueForConfiguredLang,
} from "../xmltv/index.js";
import { failure, isFailure, isSuccess, unwrap } from "../result/index.js";
import {
  createOverlayConfigFromProgramme,
  makeVideo,
} from "../video-generator/index.js";
import path from "node:path";
import { appConfig } from "../config/app.js";
import type { XmltvChannel, XmltvProgramme } from "@iptv/xmltv";
import { logError, logInfo } from "../logger/index.js";

const channelTask = async (
  channel: XmltvChannel,
  programmes: XmltvProgramme[],
): ReturnType<typeof makeVideo> => {
  const currentProgramme = getNextProgrammeForChannel(channel, programmes);
  if (isFailure(currentProgramme)) {
    return failure("Failed to get next programme", currentProgramme.error);
  }

  const overlay = createOverlayConfigFromProgramme(currentProgramme.result);
  if (isFailure(overlay)) {
    return failure("Failed to get overlay config", overlay.error);
  }

  return makeVideo({
    overlay: overlay.result,
    outputDir: appConfig.outputFolder,
    outputFileName: `channel-${channel.id}.mp4`,
    length: 20,
    channelInfo: {
      id: channel.id,
      name: unwrap(getValueForConfiguredLang(channel.displayName)),
    },
    background: appConfig.backgroundContentFolder
      ? {
          filePath: path.join(
            appConfig.backgroundContentFolder,
            "background-1.mp4",
          ),
          startSeconds: 10,
          endSeconds: 2711,
        }
      : undefined,
  });
};

export default async () => {
  logInfo(`Starting main job...`);
  const xmlTv = await fetchAndParseXmlTv(appConfig.xmlTvUrl);
  if (isSuccess(xmlTv)) {
    for (const channel of xmlTv.result.channels) {
      logInfo(`Started task for channel ${channel.id}`);
      const result = await channelTask(channel, xmlTv.result.programmes);
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
