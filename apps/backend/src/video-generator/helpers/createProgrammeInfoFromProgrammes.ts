import type { XmltvProgramme } from "@iptv/xmltv";

import type { ProgrammeInfo } from "bumpgen-shared/types";
import { isNotUndefined } from "bumpgen-shared/utils";

import {
  getBestIcon,
  getOnScreenEpisodeNumber,
  getValueForConfiguredLang,
  type NextProgrammes,
} from "../../xmltv/index.js";
import {
  failure,
  isFailure,
  success,
  unwrap,
  type Result,
} from "../../result/index.js";

export const createProgrammeInfoFromProgrammes = (
  programmes: NextProgrammes,
): Result<[ProgrammeInfo, ...ProgrammeInfo[]]> => {
  const createProgrammeInfo = (
    programme: XmltvProgramme,
  ): Result<ProgrammeInfo> => {
    const title = getValueForConfiguredLang(programme.title);
    if (isFailure(title)) {
      return failure("Title required to create overlay");
    }

    const subtitle = getValueForConfiguredLang(programme.subTitle);
    const episode = getOnScreenEpisodeNumber(programme.episodeNum);
    const description = getValueForConfiguredLang(programme.desc);
    const iconUrl = getBestIcon(programme.icon);

    return success({
      title: title.result,
      subtitle: unwrap(subtitle),
      episode: unwrap(episode),
      description: unwrap(description),
      start: programme.start,
      end: programme.stop,
      iconUrl: unwrap(iconUrl),
    });
  };

  const firstItemResult = createProgrammeInfo(programmes[0]);

  if (isFailure(firstItemResult)) {
    // Pass on the failure
    return firstItemResult;
  }

  return success([
    firstItemResult.result,
    ...programmes
      .slice(1)
      .map(createProgrammeInfo)
      .map(unwrap)
      .filter(isNotUndefined),
  ]);
};
