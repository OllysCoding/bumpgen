import "dotenv/config";

import { appConfig } from "./config/app.js";
import { Templates } from "./templates/index.js";
import { Fonts } from "./fonts/index.js";
import { jobScheduler } from "./jobs/index.js";

const initialize = async () => {
  await appConfig.loadConfig();

  if (appConfig.isInitialized) {
    await Templates.registerTemplates();
    await Fonts.registerFonts();

    // Startup any jobs
    jobScheduler.startup();
  }
};

initialize();
