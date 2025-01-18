import ffmpeg from "fluent-ffmpeg";
import { glob } from "glob";
import {
  appConfig,
  type BackgroundContentConfig,
  type ChannelConfig,
} from "../../config/app.js";
import {
  failure,
  isSuccess,
  success,
  type Result,
} from "../../result/index.js";
import { logDebug, logError } from "../../logger/index.js";
import { pickRandom } from "./pickRandom.js";
import { isNotUndefined } from "bumpgen-shared/utils";
import { resolve } from "node:path";

const getRelativePath = (absolutePath: string): string => {
  return absolutePath.slice(
    resolve(appConfig.config.backgroundContentFolder).length + 1,
  );
};

const getBackgroundContentConfig = (
  filepath: string,
): BackgroundContentConfig | undefined => {
  return appConfig.config.backgroundContent?.[filepath];
};

const getLengthOfVideoFile = (filepath: string): Promise<Result<number>> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filepath, (err, data) => {
      if (err) {
        logError(`Failed to get file info ${filepath}`, err);
        resolve(failure("Unknown ffprobe error", err));
      } else if (data.format.duration) {
        resolve(success(data.format.duration));
      } else {
        logError(`Ffprobe did not return duration for file ${filepath}`);
        resolve(failure("ffprobe did not return duration"));
      }
    });
  });
};

const getFittingWindows = (
  windows: [number, number][],
  length: number,
  fileEnd: number,
) => {
  return windows.filter(
    ([start, end]) => end <= fileEnd && end - start >= length,
  );
};

const getFilesWhichFitLength = async (
  files: [string, string][],
  length: number,
): Promise<{ file: [string, string]; windows: [number, number][] }[]> => {
  const filteredFiles: {
    file: [string, string];
    windows: [number, number][];
  }[] = [];
  for (const [filepath, name] of files) {
    const fileLength = await getLengthOfVideoFile(filepath);
    if (isSuccess(fileLength)) {
      const config = getBackgroundContentConfig(name);
      if (config) {
        const windows = getFittingWindows(
          config.windows,
          length,
          fileLength.result,
        );
        if (windows.length > 0) {
          filteredFiles.push({
            file: [filepath, name],
            windows,
          });
        }
      } else if (fileLength.result >= length) {
        filteredFiles.push({
          file: [filepath, name],
          windows: [[0, fileLength.result]],
        });
      }
    }
  }
  return filteredFiles;
};

export const getBackgroundContentForChannel = async (
  channelConfig: ChannelConfig,
  length: number,
): Promise<
  Result<{
    filePath: string;
    startSeconds: number;
    endSeconds: number;
  }>
> => {
  const allAvailableFiles: [string, string][] = (
    await glob(`${appConfig.config.backgroundContentFolder}/*`, {
      absolute: true,
    })
  )
    .map(
      (filename) => [filename, getRelativePath(filename)] as [string, string],
    )
    .filter(([, relative]) => isNotUndefined(relative));

  if (allAvailableFiles.length === 0) {
    return failure("No background content available");
  }

  let filteredFiles: [string, string][] = allAvailableFiles;
  if (Array.isArray(channelConfig.backgroundContent)) {
    filteredFiles = allAvailableFiles.filter(([, name]) =>
      channelConfig.backgroundContent.includes(name),
    );
    if (filteredFiles.length !== channelConfig.backgroundContent.length) {
      const missing = allAvailableFiles.filter(
        ([, name]) => !channelConfig.backgroundContent.includes(name),
      );
      logDebug(
        "Some files configured for channel are missing from background contents folder: ",
        missing,
      );
    }
    if (filteredFiles.length === 0) {
      return failure("No background content available once filter is applied");
    }
  }

  const options = await getFilesWhichFitLength(filteredFiles, length);

  if (options.length === 0) {
    logError(`No files available which fit required length: ${length}`);
    return failure("No files which fit length");
  } else if (options.length !== filteredFiles.length) {
    const missing = filteredFiles.filter(
      ([, name]) => options.findIndex(({ file }) => file[1] === name) === -1,
    );
    logDebug(
      "Some files were not long enough to be used for background content: ",
      missing,
    );
  }

  const pickedFile = pickRandom(options);
  const [startSeconds, endSeconds] = pickRandom(pickedFile.windows);
  return success({
    filePath: pickedFile.file[0],
    startSeconds,
    endSeconds,
  });
};
