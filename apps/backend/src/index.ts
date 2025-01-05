// Load configs
import "dotenv/config";
import "./config/load.js";

import { scheduleJob } from "node-schedule";

import main from "./jobs/main.js";
import { appConfig } from "./config/app.js";
import { Templates } from "./templates/index.js";
import { Fonts } from "./fonts/index.js";

await Templates.registerTemplates();
await Fonts.registerFonts();

scheduleJob(`*/${appConfig.interval || 5} * * * *`, main);
