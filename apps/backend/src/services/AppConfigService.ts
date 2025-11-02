import { Ajv, type JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import { logError, LogLevel } from "../logger/index.js";

import { exit } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import {
  failure,
  isFailure,
  isSuccess,
  success,
  type Result,
} from "../result/index.js";

import { type Static, Type } from "@sinclair/typebox";
import { isNotUndefined } from "bumpgen-shared/utils";
import { Service } from "typedi";
import type { BumpgenService } from "./types.js";

const DEFAULT_CONFIG_PATH = "../../configs/bumpgen.config.json";

const ajv = new Ajv();
addFormats(ajv);

export const ChannelConfigSchema = Type.Object({
  channelIds: Type.Union([Type.Literal("*"), Type.Array(Type.String())]),
  template: Type.String(),
  backgroundContent: Type.Union([Type.Literal("*"), Type.Array(Type.String())]),
  length: Type.Union([Type.Literal("*"), Type.Number({ minimum: 0 })]),
  resolution: Type.Object({
    width: Type.Number({ minimum: 10 }),
    height: Type.Number({ minimum: 10 }),
  }),
});
export type ChannelConfig = Static<typeof ChannelConfigSchema>;

export const BackgroundContentConfigSchema = Type.Object({
  windows: Type.Array(Type.Tuple([Type.Number(), Type.Number()])),
});
export type BackgroundContentConfig = Static<
  typeof BackgroundContentConfigSchema
>;

export const AppConfigSchema = Type.Object({
  logLevel: Type.Enum(LogLevel),
  language: Type.String(),
  experimentalPluginsSupport: Type.Boolean(),
  interval: Type.Number({ minimum: 1, maximum: 60 }),
  xmlTvUrl: Type.String({ format: "uri" }),
  outputFolder: Type.String(),
  backgroundContentFolder: Type.String(),
  backgroundContent: Type.Optional(
    Type.Record(Type.String(), BackgroundContentConfigSchema),
  ),
  channels: Type.Array(ChannelConfigSchema),
});

export type AppConfig = Static<typeof AppConfigSchema>;

const validate = ajv.compile(
  AppConfigSchema as unknown as JSONSchemaType<AppConfig>,
);

type OnInitializedEvent = (config: AppConfig) => Promise<void>;
type OnUpdatedEvent = (config: AppConfig) => Promise<void>;

type AddOnInitialised = ["onInitialized", OnInitializedEvent];
type AddOnUpdated = ["onUpdated", OnUpdatedEvent];

export const configFilePath =
  process.env.CONFIG_FILE_PATH || DEFAULT_CONFIG_PATH;

@Service()
export class AppConfigService implements BumpgenService {
  private _config: AppConfig | undefined = undefined;
  private _initialized = false;
  private _onInitialized: OnInitializedEvent[] = [];
  private _onUpdated: OnUpdatedEvent[] = [];
  public get config(): AppConfig {
    if (this._config === undefined) {
      logError("Tried to access config before it was initialized");
      exit(1);
    }

    return this._config;
  }
  private set config(value: AppConfig) {
    this._config = { ...value };
  }

  public get isInitialized() {
    return this._initialized;
  }

  private initialize = (config: AppConfig) => {
    this.config = config;
    this._initialized = true;

    const callEvents = async () => {
      for (const event of this._onInitialized) {
        try {
          await event(config);
        } catch (e) {
          logError("Error occurred on onInitialized event", e);
        }
      }
    };

    callEvents().catch();
  };

  public addEventListener = (...args: AddOnInitialised | AddOnUpdated) => {
    switch (args[0]) {
      case "onUpdated":
        return this._onUpdated.push(args[1]);
      case "onInitialized":
        return this._onInitialized.push(args[1]);
    }
  };
  public removeEventListener = (...args: AddOnInitialised | AddOnUpdated) => {
    switch (args[0]) {
      case "onUpdated":
        return (this._onUpdated = this._onUpdated.filter(
          (func) => func !== args[1],
        ));
      case "onInitialized":
        return (this._onInitialized = this._onInitialized.filter(
          (func) => func !== args[1],
        ));
    }
  };

  public onInitialised = (event: OnInitializedEvent) =>
    this._onInitialized.push(event);

  public onUpdated = (event: OnUpdatedEvent) => this._onUpdated.push(event);

  public initializeFromDefaults = async (
    xmlTvUrl: string,
    language: string,
    outputFolder: string,
    backgroundContentFolder: string,
  ): Promise<Result<AppConfig>> => {
    const result = await this.updateConfig({
      logLevel: LogLevel.INFO,
      interval: 5,
      xmlTvUrl,
      language,
      outputFolder,
      backgroundContentFolder,
      experimentalPluginsSupport: false,
      channels: [],
    });
    if (isSuccess(result)) {
      this.initialize(result.result);
    }

    return result;
  };

  private updateConfig = async (
    newConfig: AppConfig,
  ): Promise<Result<AppConfig>> => {
    try {
      const clonedConfig = structuredClone(newConfig);
      await writeFile(
        configFilePath,
        JSON.stringify(clonedConfig, undefined, "\t"),
      );

      this.config = clonedConfig;

      const callEvents = async () => {
        for (const event of this._onUpdated) {
          try {
            await event(clonedConfig);
          } catch (e) {
            logError("Error occurred on _onUpdated event", e);
          }
        }
      };

      callEvents().catch();

      return success(clonedConfig);
    } catch (err) {
      logError("Failed to write updated config to " + configFilePath, err);
      return failure("Failed to write updated config to " + configFilePath);
    }
  };

  public updateSettings = async (
    newSettings: Pick<
      AppConfig,
      | "backgroundContentFolder"
      | "experimentalPluginsSupport"
      | "interval"
      | "logLevel"
      | "language"
      | "outputFolder"
      | "xmlTvUrl"
    >,
  ): Promise<Result<AppConfig>> => {
    const result = await this.updateConfig({
      ...this.config,
      ...newSettings,
    });

    return result;
  };

  private checkChannelConfigValid = (
    channelConfig: ChannelConfig,
    configsToCheckAgainst: ChannelConfig[],
  ): Result<undefined> => {
    if (channelConfig.channelIds === "*") {
      if (configsToCheckAgainst.some((c) => c.channelIds === "*")) {
        return failure('Only one channel config can exist with key "*"');
      }
    } else {
      const overlap = channelConfig.channelIds.filter((id) => {
        return (
          configsToCheckAgainst.findIndex((c) =>
            Array.isArray(c.channelIds) ? c.channelIds.includes(id) : false,
          ) !== -1
        );
      });
      if (overlap.length) {
        return failure(
          `Channel ids ${overlap.join(", ")} are already set in other channel configs`,
        );
      }
    }

    return success(undefined);
  };

  public addChannelConfig = async (
    channelConfig: ChannelConfig,
  ): Promise<Result<AppConfig>> => {
    const isValid = this.checkChannelConfigValid(
      channelConfig,
      this.config.channels,
    );
    if (isFailure(isValid)) return isValid;

    return this.updateConfig({
      ...this.config,
      channels: [...this.config.channels, channelConfig],
    });
  };

  public updateChannelConfig = async (
    index: number,
    channelConfig: ChannelConfig,
  ): Promise<Result<AppConfig>> => {
    if (this.config.channels[index] === undefined) {
      return failure("No channel config exists at index " + index);
    }

    const configsToCheckAgainst = this.config.channels
      .filter((_, i) => i !== index)
      .filter(isNotUndefined);
    const isValid = this.checkChannelConfigValid(
      channelConfig,
      configsToCheckAgainst,
    );
    if (isFailure(isValid)) return isValid;

    const updatedChannels = this.config.channels.map((c, i) => {
      if (i === index) return channelConfig;
      return c;
    });

    return this.updateConfig({
      ...this.config,
      channels: updatedChannels,
    });
  };

  public deleteChannelConfig = async (
    index: number,
  ): Promise<Result<AppConfig>> => {
    if (this.config.channels[index] === undefined) {
      return failure("No channel config exists at index " + index);
    }

    const updatedChannels = this.config.channels.filter((c, i) => {
      if (i === index) return false;
      return true;
    });

    return this.updateConfig({
      ...this.config,
      channels: updatedChannels,
    });
  };

  public addBackgroundContentConfig = async (
    filePath: string,
    backgroundContentConfig: BackgroundContentConfig,
  ): Promise<Result<AppConfig>> => {
    if (this.config.backgroundContent?.[filePath] !== undefined) {
      return failure(
        "A background content config already exists for file" + filePath,
      );
    }
    return this.updateConfig({
      ...this.config,
      backgroundContent: {
        ...(this.config.backgroundContent ?? {}),
        [filePath]: backgroundContentConfig,
      },
    });
  };

  public updateBackgroundContentConfig = async (
    filePath: string,
    backgroundContentConfig: BackgroundContentConfig,
  ): Promise<Result<AppConfig>> => {
    if (this.config.backgroundContent?.[filePath] === undefined) {
      return failure(
        "A background content config must exist for file" + filePath,
      );
    }
    return this.updateConfig({
      ...this.config,
      backgroundContent: {
        ...(this.config.backgroundContent ?? {}),
        [filePath]: backgroundContentConfig,
      },
    });
  };

  public deleteBackgroundContentConfig = async (
    filePath: string,
  ): Promise<Result<AppConfig>> => {
    if (this.config.backgroundContent?.[filePath] === undefined) {
      return failure(
        "A background content config must exist for file" + filePath,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [filePath]: _, ...remaining } = this.config.backgroundContent ?? {};

    return this.updateConfig({
      ...this.config,
      backgroundContent: remaining,
    });
  };

  public initializeFromConfigFile = async (
    reload = false,
  ): Promise<Result<undefined>> => {
    if (this._config !== undefined && !reload) return success(undefined);

    try {
      const value = await readFile(configFilePath, "utf-8");
      const parsed = JSON.parse(value);

      if (validate(parsed)) {
        this.initialize(parsed);
        return success(undefined);
      } else {
        logError("Failed to initiliaze: error parsing config", validate.errors);
        exit(1);
      }
    } catch (err) {
      logError(
        "Failed to initiliaze: config file cannot be opened at " +
          configFilePath,
        err,
      );
      return failure(
        "Failed to initiliaze: config file cannot be opened at " +
          configFilePath,
      );
    }
  };

  public load = () => {
    if (!this.isInitialized) {
      return this.initializeFromConfigFile();
    } else {
      return Promise.resolve(success(undefined));
    }
  };

  public unload = () => {
    // Do Nothing
    return Promise.resolve(success(undefined));
  };

  public run = () => {
    // Do Nothing
    return Promise.resolve(success(undefined));
  };
}
