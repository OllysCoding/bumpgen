import "reflect-metadata";
import "dotenv/config";

import { Container } from "typedi";

import { initializeApi } from "./api/index.js";
import { AppConfigService } from "./services/AppConfigService.js";
import { BackgroundContentService } from "./services/BackgroundContentService.js";
import { FontsService } from "./services/FontsService.js";
import { TemplatesService } from "./services/TemplatesService.js";
import { XmlTvService } from "./services/XmlTvService.js";
import { JobSchedulerService } from "./services/JobSchedulerService.js";
import { logInfo } from "./logger/index.js";
import { LiveStatsService } from "./services/LiveStatsService.js";

const initialize = async () => {
  // appConfig.onInitialised(async () => {
  //   await Templates.registerTemplates();
  //   await Fonts.registerFonts();

  //   // Startup any jobs
  //   jobScheduler.startup();
  // });

  // await appConfig.initializeFromConfigFile();

  logInfo("Starting services...");

  await Container.get(AppConfigService).load();
  await Container.get(FontsService).load();
  await Container.get(TemplatesService).load();
  await Container.get(BackgroundContentService).load();
  await Container.get(XmlTvService).load();
  await Container.get(JobSchedulerService).load();
  await Container.get(LiveStatsService).load();

  logInfo("Services successfully started");

  await initializeApi();
};

initialize();
