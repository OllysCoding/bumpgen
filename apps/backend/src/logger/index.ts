import { appConfig } from "../config/app.js";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  ERROR = "ERROR",
}

const logLevelMap = {
  [LogLevel.DEBUG]: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.ERROR],
  [LogLevel.INFO]: [LogLevel.INFO, LogLevel.ERROR],
  [LogLevel.ERROR]: [LogLevel.ERROR],
};

export const log = (
  level: LogLevel,
  message: string,
  ...args: unknown[]
): void => {
  if (
    logLevelMap[
      appConfig.isInitialized ? appConfig.config.logLevel : LogLevel.DEBUG
    ].includes(level)
  ) {
    console.log(`[${new Date().toISOString()} - ${level}] ` + message, ...args);
  }
};

export const logError = (message: string, ...args: unknown[]): void => {
  return log(LogLevel.ERROR, message, ...args);
};

export const logInfo = (message: string, ...args: unknown[]): void => {
  return log(LogLevel.INFO, message, ...args);
};

export const logDebug = (message: string, ...args: unknown[]): void => {
  return log(LogLevel.DEBUG, message, ...args);
};
