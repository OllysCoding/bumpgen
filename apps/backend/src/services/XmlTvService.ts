import { Service } from "typedi";
import { logDebug, logError } from "../logger/index.js";
import {
  parseXmltv,
  type XmltvChannel,
  type XmltvEpisodeNumber,
  type XmltvIcon,
  type XmltvProgramme,
} from "@iptv/xmltv";
import type { BumpgenService } from "./types.js";
import { failure, success, type Result } from "../result/index.js";
import { AppConfigService } from "./AppConfigService.js";

export type NextProgrammes = [XmltvProgramme, ...XmltvProgramme[]];

@Service()
export class XmlTvService implements BumpgenService {
  private _programmes: XmltvProgramme[] = [];
  private _channels: XmltvChannel[] = [];

  public get programmes() {
    return this._programmes;
  }

  public get channels() {
    return this._channels;
  }

  constructor(public appConfigService: AppConfigService) {}

  private fetchAndParse = async (): Promise<Result<undefined>> => {
    try {
      const response = await fetch(this.appConfigService.config.xmlTvUrl);
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
        this._channels = channels;
        this._programmes = programmes;
        return success(undefined);
      }
    } catch (err) {
      logError("Failed to fetch & parse XML TV file: ", err);
      return failure("Failed to fetch & parse XML TV file: ", err);
    }
  };

  public load = async () => {
    if (!this.appConfigService.isInitialized) {
      return Promise.resolve(success(undefined));
    }

    return this.fetchAndParse();
  };

  public unload = () => {
    return Promise.resolve(success(undefined));
  };

  public run = async () => {
    if (!this.appConfigService.isInitialized) {
      return Promise.resolve(failure("App not initiazed"));
    }

    return this.fetchAndParse();
  };

  public getNextProgrammesForChannel = (
    channel: XmltvChannel,
  ): Result<NextProgrammes> => {
    const forChannel = this.programmes.filter((p) => p.channel === channel.id);
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

    return success([sorted[nextUpIndex]!, ...sorted.slice(nextUpIndex + 1)]);
  };

  public getOnScreenEpisodeNumber = (
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

  public getValueForConfiguredLang = <T>(
    arr: { lang?: string; _value: T }[] | undefined,
    fallbackToFirstItemWithNoLang = true,
  ): Result<T> => {
    if (!arr) {
      return failure("Field is empty");
    }

    const value = arr.find(
      (v) => v.lang === this.appConfigService.config.language,
    );
    if (value) {
      return success(value._value);
    } else {
      if (fallbackToFirstItemWithNoLang) {
        const fallback = arr.find((v) => v.lang === undefined);
        if (fallback) return success(fallback._value);
      }
      return failure(
        "Failed to find field for lang",
        +this.appConfigService.config.language,
      );
    }
  };

  public getBestIcon = (arr?: XmltvIcon[]): Result<string> => {
    if (!arr || !arr[0]) {
      return failure("No icons available for programme");
    }

    if (arr.length === 1) {
      return success(arr[0].src);
    }

    return failure("Multiple icons not yet supported");
  };
}
