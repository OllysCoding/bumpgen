import ffmpeg from "fluent-ffmpeg";
import { Service } from "typedi";
import type { BumpgenService } from "./types.js";
import { failure, isFailure, success, type Result } from "../result/index.js";
import { glob } from "glob";
import { resolve } from "path";
import { isNotUndefined } from "bumpgen-shared/utils";
import { logError } from "../logger/index.js";
import {
  AppConfigService,
  type BackgroundContentConfig,
} from "./AppConfigService.js";

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

export interface BackgroundContent {
  relativePath: string;
  fullPath: string;
  length: number;
  config?: BackgroundContentConfig;
}

@Service()
export class BackgroundContentService implements BumpgenService {
  private _files: BackgroundContent[] = [];

  public get files() {
    return this._files;
  }

  constructor(public appConfigService: AppConfigService) {}

  private getRelativePath = (absolutePath: string): string => {
    return absolutePath.slice(
      resolve(this.appConfigService.config.backgroundContentFolder).length + 1,
    );
  };

  private fetchAll = async (): Promise<Result<undefined>> => {
    try {
      const allAvailableFiles: { relativePath: string; fullPath: string }[] = (
        await glob(
          `${this.appConfigService.config.backgroundContentFolder}/*`,
          {
            absolute: true,
          },
        )
      )
        .map((filepath) => ({
          fullPath: filepath,
          relativePath: this.getRelativePath(filepath),
        }))
        .filter(({ relativePath }) => isNotUndefined(relativePath));

      const filesWithLength = (
        await Promise.all(
          allAvailableFiles.map(async (file) => {
            const result = await getLengthOfVideoFile(file.fullPath);
            if (isFailure(result)) {
              return undefined;
            }

            return {
              ...file,
              length: result.result,
            };
          }),
        )
      ).filter(isNotUndefined);

      const filesWithConfigs = filesWithLength.map((file) => {
        return {
          ...file,
          config:
            this.appConfigService.config.backgroundContent?.[file.relativePath],
        };
      });

      this._files = filesWithConfigs;
      return success(undefined);
    } catch (err) {
      return failure("Failed to look up background content", err);
    }
  };

  private onUpdatedOrInitialized = async (): Promise<void> => {
    await this.fetchAll();
  };

  public load = () => {
    this.appConfigService.addEventListener(
      "onUpdated",
      this.onUpdatedOrInitialized,
    );
    this.appConfigService.addEventListener(
      "onInitialized",
      this.onUpdatedOrInitialized,
    );

    if (!this.appConfigService.isInitialized) {
      return Promise.resolve(success(undefined));
    }

    return this.fetchAll();
  };

  public unload = () => {
    this.appConfigService.removeEventListener(
      "onUpdated",
      this.onUpdatedOrInitialized,
    );
    this.appConfigService.removeEventListener(
      "onInitialized",
      this.onUpdatedOrInitialized,
    );
    return Promise.resolve(success(undefined));
  };

  public run = () => {
    if (!this.appConfigService.isInitialized) {
      return Promise.resolve(failure("App not initiazed"));
    }

    return this.fetchAll();
  };
}
