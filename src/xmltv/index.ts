import { parseXmltv, type Xmltv, type XmltvChannel, type XmltvEpisodeNumber, type XmltvIcon, type XmltvProgramme } from '@iptv/xmltv';

import { logDebug, logError } from '../logger/index.js';
import { failure, success, type Result } from '../result/index.js';
import assert, { fail } from 'node:assert';
import { appConfig } from '../config/app.js';


export const fetchAndParseXmlTv = async (path: string): Promise<Result<{
  channels: XmltvChannel[],
  programmes: XmltvProgramme[]
}>> => {
  try { 
    const response = await fetch(path);
    const body = await response.text();
    const xmlTv = parseXmltv(body);

    if (!xmlTv.channels) {
      return failure('XMLTV file did not return any channels')
    } else if (!xmlTv.programmes) {
      return failure('XMLTV file did not return any programmes')
    } else {
      return success({
        programmes: xmlTv.programmes!,
        channels: xmlTv.channels!,
      })
    }
  } catch (err) {
    logError('Failed to fetch & parse XML TV file: ', err);
    return failure('Filed to fetch & parse XML TV file', err)
  }
}

export const getNextProgrammeForChannel = (channel: XmltvChannel, programmes: XmltvProgramme[]): Result<XmltvProgramme>  => {
  const forChannel = programmes.filter((p) => p.channel === channel.id);
  const sorted = [...forChannel].sort((a, b) => {
    return a.start.getTime() - b.start.getTime();
  });

  const current = sorted.find((programme) => {
    if (Date.now() < programme.start.getTime()) return true;
    else return false;
  });

  if (current) {
    return success(current);
  } else {
    logDebug('Failed to find current program for channel ' + channel.id)
    return failure('Failed to find current programme playing on channel with id ' + channel.id);
  }
}

export const getOnScreenEpisodeNumber = (arr?: XmltvEpisodeNumber[], fallbackToFirstItemWithNoSystem = false): Result<string> => {
  if (!arr) {
    return failure('No episode numbers for programme');
  }

  const value = arr.find((v) => v.system === "onscreen");

  if (value && value._value) {
    return success(value._value);
  } else {
    if (fallbackToFirstItemWithNoSystem) {
      const fallback = arr.find((v) => v.system === undefined && v._value !== undefined);
      if (fallback) return success(fallback._value!);
    }
    return failure('Failed to find on screen episode number')
  }
}

export const getValueForConfiguredLang = <T>(arr: { lang?: string, _value: T }[] | undefined, fallbackToFirstItemWithNoLang = true): Result<T> => {
  if (!arr) {
    return failure('Field is empty');
  }

  const value = arr.find((v) => v.lang === appConfig.language);
  if (value) {
    return success(value._value);
  } else {
    if (fallbackToFirstItemWithNoLang) {
      const fallback = arr.find((v) => v.lang === undefined);
      if (fallback) return success(fallback._value);
    }
    return failure('Failed to find field for lang', + appConfig.language)
  }
} 

export const getBestIcon = (arr?: XmltvIcon[]): Result<string> => {
  if (!arr || !arr[0]) {
    return failure('No icons available for programme');
  }

  if (arr.length === 1) {
    return success(arr[0].src);
  }

  return failure('Multiple icons not yet supported');
}
