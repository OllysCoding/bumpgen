import { Ajv, type JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import { logError, LogLevel } from "../logger/index.js";

import { exit } from "node:process";
import { readFile } from "node:fs/promises";
import { failure, success, type Result } from "../result/index.js";

const DEFAULT_CONFIG_PATH = "../../configs/bumpgen.config.json";

const ajv = new Ajv();
addFormats(ajv);

type BackgroundContentPath = string;
export interface ChannelConfig {
  /**
   * Array of channels this config applies to
   */
  channelIds: "*" | string[];
  /**
   * e.g "centre-title-and-time"
   */
  template: string;
  /**
   * "*" = All background content
   * ["path/relative/to/bg/folder",]
   */
  backgroundContent: "*" | string[];
  /**
   * Time in secodns
   */
  length: "*" | number;
  resolution: {
    width: number;
    height: number;
  };
  /**
   * Time in seconds
   */
  padding?: number;
}

export interface BackgroundContentConfig {
  /**
   * [startSeconds, endSeconds]
   */
  windows: [number, number][];
}

export interface AppConfig {
  logLevel: LogLevel;
  language: string;
  experimentalPluginsSupport: boolean;
  /**
   * Number of minutes between checks.
   */
  interval?: number;
  xmlTvUrl: string;
  outputFolder: string;
  backgroundContentFolder: string;
  backgroundContent?: Record<BackgroundContentPath, BackgroundContentConfig>;
  channels: ChannelConfig[];
  /**
   * TODO
   */
  // padding: how long to wait after a show has started before generating the next clip
}

const schema: JSONSchemaType<AppConfig> = {
  type: "object",
  properties: {
    logLevel: {
      type: "string",
      enum: Object.values(LogLevel),
    },
    experimentalPluginsSupport: { type: "boolean" },
    language: { type: "string" },
    interval: { type: "number", nullable: true, minimum: 1, maximum: 60 },
    xmlTvUrl: { type: "string", format: "uri" },
    outputFolder: { type: "string" },
    backgroundContentFolder: { type: "string" },
    backgroundContent: {
      type: "object",
      nullable: true,
      additionalProperties: {
        type: "object",
        properties: {
          windows: {
            type: "array",
            items: {
              type: "array",
              items: [{ type: "number" }, { type: "number" }],
              maxItems: 2,
              minItems: 2,
            },
          },
        },
        required: [],
      },
      required: [],
    },
    channels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          channelIds: {
            oneOf: [
              {
                type: "array",
                items: { type: "string" },
                minItems: 1,
              },
              {
                type: "string",
                enum: ["*"],
              },
            ],
          },
          template: {
            type: "string",
          },
          backgroundContent: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          length: {
            oneOf: [{ type: "string", enum: ["*"] }, { type: "number" }],
          },
          resolution: {
            type: "object",
            properties: {
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["width", "height"],
          },
          padding: {
            type: "number",
            nullable: true,
          },
        },
        required: [
          "channelIds",
          "template",
          "backgroundContent",
          "length",
          "resolution",
        ],
      },
    },
  },
  required: [
    "logLevel",
    "language",
    "experimentalPluginsSupport",
    "xmlTvUrl",
    "outputFolder",
    "backgroundContentFolder",
    "channels",
  ],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

export const configFilePath =
  process.env.CONFIG_FILE_PATH || DEFAULT_CONFIG_PATH;

class App {
  private _config: AppConfig | undefined = undefined;
  private _initialized = false;
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
  };

  loadConfig = async (reload = false): Promise<Result<undefined>> => {
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
}

export const appConfig = new App();
