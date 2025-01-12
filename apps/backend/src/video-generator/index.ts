import type { XmltvProgramme } from "@iptv/xmltv";
import type { FabricTemplate, ProgrammeInfo } from "bumpgen-shared/types";
import { isNotUndefined } from "bumpgen-shared/utils";

import {
  failure,
  isFailure,
  success,
  unwrap,
  type Result,
} from "../result/index.js";
import {
  getBestIcon,
  getOnScreenEpisodeNumber,
  getValueForConfiguredLang,
} from "../xmltv/index.js";

import { renderer, encoder } from "../canvas2video/index.js";

import type { EncoderConfig } from "../canvas2video/types.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { logDebug, logError } from "../logger/index.js";
import { existsSync } from "node:fs";
import { Fonts } from "../fonts/index.js";

export interface ChannelInfo {
  id: string;
  name?: string;
}

export interface VideoBackground {
  filePath: string;
  startSeconds: number;
  endSeconds: number;
}

export interface VideoOptions {
  channelInfo: ChannelInfo;
  programmes: [ProgrammeInfo, ...ProgrammeInfo[]];
  background?: VideoBackground;
  outputDir: string;
  outputFileName: string;
  length: number;
  template: FabricTemplate;
}

const randomInteger = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getBackgroundVideoStartAndEnd = (
  options: VideoBackground,
  length: number,
): { start: number; end: number } => {
  const randomStart = randomInteger(
    options.startSeconds,
    options.endSeconds - length,
  );

  return {
    start: randomStart,
    end: randomStart + length,
  };
};

const getProgrammeId = (options: VideoOptions) =>
  `${options.programmes[0].title}-${options.programmes[0].episode}`;

const shouldGenerateVideo = async (
  options: VideoOptions,
): Promise<Result<false | (() => Promise<void>)>> => {
  try {
    const nextProgrammeId = getProgrammeId(options);
    const filePath = path.join(
      options.outputDir,
      `.channel-${options.channelInfo.id}-last-generated`,
    );

    const callback = async () => {
      await writeFile(filePath, nextProgrammeId, { encoding: "utf8" });
    };

    if (!existsSync(filePath)) {
      return success(callback);
    }

    const result = await readFile(filePath, "utf8");
    logDebug(
      `Comparinng for channel ${options.channelInfo.id} - disk ${result}, next programme ${nextProgrammeId}`,
    );
    if (nextProgrammeId !== result) {
      return success(callback);
    } else {
      return success(false);
    }
  } catch (err) {
    logError(
      `Failed to check if video for channel ${options.channelInfo.id} should be generated`,
      err,
    );
    return failure(
      `Failed to check if video for channel ${options.channelInfo.id} should be generated`,
      err,
    );
  }
};

export const makeVideo = async (
  options: VideoOptions,
): Promise<Result<"generated" | "not-generated">> => {
  const shouldGenerateResult = await shouldGenerateVideo(options);
  if (isFailure(shouldGenerateResult)) {
    return shouldGenerateResult;
  }

  const generationCompleteTask = shouldGenerateResult.result;
  if (generationCompleteTask === false) {
    return success("not-generated");
  }

  try {
    const width = 1920;
    const height = 1080;

    const stream = await renderer({
      width,
      height,
      fps: 1,
      makeScene: async (fabric, canvas, anim, compose) => {
        await options.template(options.programmes, {
          getFontProperties: (...args) => Fonts.getFontProperties(...args),
          convertX: (val: number) => val * width,
          convertY: (val: number) => val * height,
        })(fabric, canvas, anim);
        anim.duration(options.length);
        compose();
      },
    });

    const baseEncoderConfig: EncoderConfig = {
      width: 1920,
      height: 1080,
      frameStream: stream,
      output: path.join(options.outputDir, options.outputFileName),
      fps: {
        input: 1,
        output: 30,
      },
    };

    if (options.background) {
      const { start, end } = getBackgroundVideoStartAndEnd(
        options.background,
        options.length,
      );
      await encoder({
        ...baseEncoderConfig,
        backgroundVideo: {
          videoPath: options.background.filePath,
          cut: {
            startSeconds: start,
            endSeconds: end,
          },
          inSeconds: 0,
          outSeconds: options.length,
        },
      });
    } else {
      await encoder(baseEncoderConfig);
    }
    await generationCompleteTask();
    return success("generated");
  } catch (err) {
    return failure("Failed to create video", err);
  }
};

export const createProgrammeInfoFromProgrammes = (
  programmes: [XmltvProgramme, ...XmltvProgramme[]],
): Result<[ProgrammeInfo, ...ProgrammeInfo[]]> => {
  const createProgrammeInfo = (
    programme: XmltvProgramme,
  ): Result<ProgrammeInfo> => {
    const title = getValueForConfiguredLang(programme.title);
    if (isFailure(title)) {
      return failure("Title required to create overlay");
    }

    const subtitle = getValueForConfiguredLang(programme.subTitle);
    const episode = getOnScreenEpisodeNumber(programme.episodeNum);
    const description = getValueForConfiguredLang(programme.desc);
    const iconUrl = getBestIcon(programme.icon);

    return success({
      title: title.result,
      subtitle: unwrap(subtitle),
      episode: unwrap(episode),
      description: unwrap(description),
      start: programme.start,
      end: programme.stop,
      iconUrl: unwrap(iconUrl),
    });
  };

  const firstItemResult = createProgrammeInfo(programmes[0]);

  if (isFailure(firstItemResult)) {
    // Pass on the failure
    return firstItemResult;
  }

  return success([
    firstItemResult.result,
    ...programmes
      .slice(1)
      .map(createProgrammeInfo)
      .map(unwrap)
      .filter(isNotUndefined),
  ]);
};
