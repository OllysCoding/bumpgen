import type { XmltvProgramme } from "@iptv/xmltv";
import type { NextProgrammes } from "../../xmltv/index.js";
import { logInfo } from "../../logger/index.js";

const DEFAULT_LENGTH = 60;

export const getFillLength = (programmes: NextProgrammes): number => {
  if (!programmes[1]) {
    logInfo(
      `"*" length option used but no next programme found, defaulting to ${DEFAULT_LENGTH} seconds.`,
    );
    return DEFAULT_LENGTH;
  }

  const getEndsAtTime = (programme: XmltvProgramme): Date | undefined => {
    if (programme.stop) return programme.stop;
    else if (programme.length) {
      const time = programme.start.getTime();
      switch (programme.length.units) {
        case "hours":
          return new Date(time + programme.length._value * 60 * 60 * 1000);
        case "minutes":
          return new Date(time + programme.length._value * 60 * 1000);
        case "seconds":
          return new Date(time + programme.length._value * 1000);
      }
    } else return undefined;
  };

  const currentEnd = getEndsAtTime(programmes[0]);
  if (!currentEnd) {
    logInfo(
      `"*" option used but no information on end time of current programme available, defaulting to ${DEFAULT_LENGTH} seconds.`,
    );
    return DEFAULT_LENGTH;
  }
  const nextStart = programmes[1].start;
  const length = Math.max((nextStart.getTime() - currentEnd.getTime()) / 1000);

  if (length === 0) {
    logInfo(
      `"*" lrngth option used but 0 seconds between start & end times, default to ${DEFAULT_LENGTH} seconds.`,
    );
    return DEFAULT_LENGTH;
  }

  return length;
};
