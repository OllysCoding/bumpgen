import type { XmltvProgramme } from "@iptv/xmltv";

import type { ProgrammeInfo } from "bumpgen-shared/types";
import { isNotUndefined } from "bumpgen-shared/utils";

import {
  failure,
  isFailure,
  success,
  unwrap,
  type Result,
} from "../../result/index.js";
import {
  XmlTvService,
  type NextProgrammes,
} from "../../services/XmlTvService.js";
import { Container } from "typedi";

export const createProgrammeInfoFromProgrammes = (
  programmes: NextProgrammes,
): Result<[ProgrammeInfo, ...ProgrammeInfo[]]> => {
  const createProgrammeInfo = (
    programme: XmltvProgramme,
  ): Result<ProgrammeInfo> => {
    const xmlTvService = Container.get(XmlTvService);
    const title = xmlTvService.getValueForConfiguredLang(programme.title);
    if (isFailure(title)) {
      return failure("Title required to create overlay");
    }

    const subtitle = xmlTvService.getValueForConfiguredLang(programme.subTitle);
    const episode = xmlTvService.getOnScreenEpisodeNumber(programme.episodeNum);
    const description = xmlTvService.getValueForConfiguredLang(programme.desc);
    const iconUrl = xmlTvService.getBestIcon(programme.icon);

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
