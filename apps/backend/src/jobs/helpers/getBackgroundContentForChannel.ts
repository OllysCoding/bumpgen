import { failure, success, type Result } from "../../result/index.js";
import { logDebug, logError } from "../../logger/index.js";
import { pickRandom } from "./pickRandom.js";
import {
  AppConfigService,
  type ChannelConfig,
} from "../../services/AppConfigService.js";
import { Container } from "typedi";
import {
  BackgroundContentService,
  type BackgroundContent,
} from "../../services/BackgroundContentService.js";

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
  files: BackgroundContent[],
  desiredLength: number,
): Promise<{ file: BackgroundContent; windows: [number, number][] }[]> => {
  const filteredFiles: {
    file: BackgroundContent;
    windows: [number, number][];
  }[] = [];
  for (const { fullPath, relativePath, length } of files) {
    if (length) {
      const config =
        Container.get(AppConfigService).config.backgroundContent?.[
          relativePath
        ];
      if (config) {
        const windows = getFittingWindows(
          config.windows,
          desiredLength,
          length,
        );
        if (windows.length > 0) {
          filteredFiles.push({
            file: { fullPath, relativePath, length },
            windows,
          });
        }
      } else if (length >= desiredLength) {
        filteredFiles.push({
          file: { fullPath, relativePath, length },
          windows: [[0, length]],
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
  const allAvailableFiles = Container.get(BackgroundContentService).files;

  if (allAvailableFiles.length === 0) {
    return failure("No background content available");
  }

  let filteredFiles: BackgroundContent[] = allAvailableFiles;
  if (Array.isArray(channelConfig.backgroundContent)) {
    filteredFiles = allAvailableFiles.filter(({ relativePath }) =>
      channelConfig.backgroundContent.includes(relativePath),
    );
    if (filteredFiles.length !== channelConfig.backgroundContent.length) {
      const missing = allAvailableFiles.filter(
        ({ relativePath }) =>
          !channelConfig.backgroundContent.includes(relativePath),
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
      ({ relativePath }) =>
        options.findIndex(({ file }) => file.relativePath === relativePath) ===
        -1,
    );
    logDebug(
      "Some files were not long enough to be used for background content: ",
      missing,
    );
  }

  const pickedFile = pickRandom(options);
  const [startSeconds, endSeconds] = pickRandom(pickedFile.windows);
  return success({
    filePath: pickedFile.file.fullPath,
    startSeconds,
    endSeconds,
  });
};
