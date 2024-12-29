// Load configs
import 'dotenv/config'
import './config/load.js'

import { scheduleJob } from 'node-schedule'

import main from './jobs/main.js'
import { appConfig } from './config/app.js'

scheduleJob(`*/${appConfig.interval || 5} * * * *`, main)
