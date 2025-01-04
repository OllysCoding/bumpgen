import { Ajv, type JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import { logError, LogLevel } from "../logger/index.js";
import { readFileSync } from "node:fs";

import { exit } from "node:process";

const DEFAULT_CONFIG_PATH = "../../configs/bumpgen.config.json";

const ajv = new Ajv();
addFormats(ajv);

type ChannelId = string;
export interface ChannelConfig {
  template: "centre-title-and-time",
  backgroundContent: "*" | string[],
}

export interface AppConfig {
  logLevel: LogLevel;
  language: string;
  experimentalPluginsSupport: boolean,
  /**
   * Number of minutes between checks.
   */
  interval?: number;
  xmlTvUrl: string;
  outputFolder: string;
  backgroundContentFolder: string;
  channels: Record<ChannelId, ChannelConfig>;
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
    experimentalPluginsSupport: { type: 'boolean' },
    language: { type: "string" },
    interval: { type: "number", nullable: true, minimum: 1, maximum: 60 },
    xmlTvUrl: { type: "string", format: "uri" },
    outputFolder: { type: "string" },
    backgroundContentFolder: { type: "string" },
    channels: { 
      type: "object",  
      additionalProperties: {
        type: "object",
        properties: {
          template: {
            type: 'string',
            enum: ['centre-title-and-time']
          },
          backgroundContent: {
            oneOf: [{ type: 'string'}, { type: "array", items: { type: 'string' } }]
          }
        },
        required: ["template", "backgroundContent"]
      },
      required: []
    }
  },
  required: [
    "logLevel",
    "language",
    "experimentalPluginsSupport",
    "xmlTvUrl",
    "outputFolder",
    "backgroundContentFolder",
    "channels"
  ],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

export const configFilePath = process.env.CONFIG_FILE_PATH || DEFAULT_CONFIG_PATH;

const getConfig = (): AppConfig => {
  try {
    const value = readFileSync(configFilePath, "utf-8");
    const parsed = JSON.parse(value);

    if (validate(parsed)) {
      return parsed;
    } else {
      logError("Failed to initiliaze: error parsing config", validate.errors);
      exit(1);
    }
  } catch (err) {
    logError(
      "Failed to initiliaze: config file cannot be opened at " + configFilePath,
      err,
    );
    exit(1);
  }
};

export const appConfig: AppConfig = getConfig();
