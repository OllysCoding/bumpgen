import {
  parseXmltv,
  type XmltvChannel,
  type XmltvEpisodeNumber,
  type XmltvIcon,
  type XmltvProgramme,
} from "@iptv/xmltv";

import { logDebug, logError } from "../logger/index.js";
import { failure, success, type Result } from "../result/index.js";
import { appConfig } from "../config/app.js";

export const fetchAndParseXmlTv = async (
  path: string,
): Promise<
  Result<{
    channels: XmltvChannel[];
    programmes: XmltvProgramme[];
  }>
> => {
  try {
    const response = await fetch(path);
    const body = await response.text();
    // Fix a weird bug where the apostrophe specifically isn't decoded
    const bodyFixed = body.replaceAll("&#39;", "'");
    const xmlTv = parseXmltv(bodyFixed);

    const { channels, programmes } = xmlTv;
    if (!channels) {
      return failure("XMLTV file did not return any channels");
    } else if (!programmes) {
      return failure("XMLTV file did not return any programmes");
    } else {
      return success({
        programmes,
        channels,
      });
    }
  } catch (err) {
    logError("Failed to fetch & parse XML TV file: ", err);
    return failure("Filed to fetch & parse XML TV file", err);
  }
};

export const getNextProgrammesForChannel = (
  channel: XmltvChannel,
  programmes: XmltvProgramme[],
): Result<[XmltvProgramme, ...XmltvProgramme[]]> => {
  const forChannel = programmes.filter((p) => p.channel === channel.id);
  const sorted = [...forChannel].sort((a, b) => {
    return a.start.getTime() - b.start.getTime();
  });

  const nextUpIndex = sorted.findIndex((programme) => {
    if (Date.now() < programme.start.getTime()) return true;
    else return false;
  });

  if (nextUpIndex === -1) {
    logDebug("Failed to find current program for channel " + channel.id);
    return failure(
      "Failed to find current programme playing on channel with id " +
        channel.id,
    );
  }

  return success([
    programmes[nextUpIndex]!,
    ...programmes.slice(nextUpIndex + 1),
  ]);
};

export const getOnScreenEpisodeNumber = (
  arr?: XmltvEpisodeNumber[],
  fallbackToFirstItemWithNoSystem = false,
): Result<string> => {
  if (!arr) {
    return failure("No episode numbers for programme");
  }

  const value = arr.find((v) => v.system === "onscreen");

  if (value && value._value) {
    return success(value._value);
  } else {
    if (fallbackToFirstItemWithNoSystem) {
      const fallback = arr.find(
        (v) => v.system === undefined && v._value !== undefined,
      );
      if (fallback && fallback._value) return success(fallback._value);
    }
    return failure("Failed to find on screen episode number");
  }
};

export const getValueForConfiguredLang = <T>(
  arr: { lang?: string; _value: T }[] | undefined,
  fallbackToFirstItemWithNoLang = true,
): Result<T> => {
  if (!arr) {
    return failure("Field is empty");
  }

  const value = arr.find((v) => v.lang === appConfig.language);
  if (value) {
    return success(value._value);
  } else {
    if (fallbackToFirstItemWithNoLang) {
      const fallback = arr.find((v) => v.lang === undefined);
      if (fallback) return success(fallback._value);
    }
    return failure("Failed to find field for lang", +appConfig.language);
  }
};

export const getBestIcon = (arr?: XmltvIcon[]): Result<string> => {
  if (!arr || !arr[0]) {
    return failure("No icons available for programme");
  }

  if (arr.length === 1) {
    return success(arr[0].src);
  }

  return failure("Multiple icons not yet supported");
};
