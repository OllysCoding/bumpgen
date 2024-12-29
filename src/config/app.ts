import { Ajv, type JSONSchemaType } from 'ajv';
import addFormats from "ajv-formats"
import { logError, LogLevel } from '../logger/index.js';
import { readFileSync } from 'node:fs';

import { exit } from 'node:process';

const DEFAULT_CONFIG_PATH = './configs/bumpgen.config.json'

const ajv = new Ajv()
//@ts-expect-error -- type is weird but this works
addFormats(ajv)

export interface AppConfig {
  logLevel: LogLevel;
  language: string;
  /**
   * Number of minutes between checks.
   */
  interval?: number;
  xmlTvUrl: string;
  outputFolder: string;
  backgroundContentFolder: string;

  /**
   * TODO
   */
  // padding: how long to wait after a show has started before generating the next clip
  // channels: what to generate for each channel by ID, '*' for a default config for all channels.
}

const schema: JSONSchemaType<AppConfig> = {
  type: "object",
  properties: {
    logLevel: {
      type: 'string',
      enum: Object.values(LogLevel)
    },
    language: { type: 'string' },
    interval: { type: 'number', nullable: true, minimum: 1, maximum: 60},
    xmlTvUrl: { type: 'string', format: 'uri' },
    outputFolder: { type: 'string' },
    backgroundContentFolder: { type: 'string' }
  },
  required: ['logLevel', 'language', 'xmlTvUrl', 'outputFolder', 'backgroundContentFolder'],
  additionalProperties: false
} 

const validate = ajv.compile(schema)

const configFilePath = process.env.CONFIG_FILE_PATH || DEFAULT_CONFIG_PATH;

const getConfig = (): AppConfig => {
  try {
    const value = readFileSync(configFilePath, 'utf-8');
    const parsed = JSON.parse(value);
  
    if (validate(parsed)) {
      return parsed
    } else {
      logError('Failed to initiliaze: error parsing config', validate.errors);
      exit(1);
    }
  } catch (err) {
    logError('Failed to initiliaze: config file cannot be opened at ' + configFilePath, err);
    exit(1);
  }
}

export const appConfig: AppConfig = getConfig();
