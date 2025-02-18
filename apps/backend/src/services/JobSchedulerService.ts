import { scheduleJob, type Job, type JobCallback } from "node-schedule";

import MainJob from "../jobs/main.js";
import { Service } from "typedi";
import { AppConfigService } from "./AppConfigService.js";
import type { BumpgenService } from "./types.js";
import { success } from "../result/index.js";

type JobName = "main";

const jobMap: Record<
  JobName,
  {
    job: JobCallback;
    getSchedule: () => string;
  }
> = {
  main: MainJob,
};

@Service()
export class JobSchedulerService implements BumpgenService {
  private scheduledJobs: Record<JobName, Job | undefined> = {
    main: undefined,
  };

  constructor(public appConfigService: AppConfigService) {}

  scheduleJob = (name: JobName) => {
    if (this.scheduledJobs[name]) {
      this.scheduledJobs[name].reschedule(jobMap[name].getSchedule());
    } else {
      this.scheduledJobs[name] = scheduleJob(
        jobMap[name].getSchedule(),
        jobMap[name].job,
      );
    }
  };

  private scheduleAllJobs = () => {
    this.scheduleJob("main");
  };

  private onUpdatedOrInitialized = () => {
    this.scheduleAllJobs();
    return Promise.resolve();
  };

  public getNextRunTime = (name: JobName): Date | undefined => {
    return this.scheduledJobs[name]?.nextInvocation();
  };

  public load = () => {
    this.appConfigService.addEventListener(
      "onUpdated",
      this.onUpdatedOrInitialized,
    );
    this.appConfigService.addEventListener(
      "onInitialized",
      this.onUpdatedOrInitialized,
    );

    if (this.appConfigService.isInitialized) {
      this.scheduleAllJobs();
    }

    return Promise.resolve(success(undefined));
  };

  public unload = () => {
    this.appConfigService.removeEventListener(
      "onUpdated",
      this.onUpdatedOrInitialized,
    );
    this.appConfigService.removeEventListener(
      "onInitialized",
      this.onUpdatedOrInitialized,
    );

    Object.values(this.scheduledJobs).forEach((job) => {
      job?.cancel();
    });

    return Promise.resolve(success(undefined));
  };

  public run = () => {
    // Do Nothing
    return Promise.resolve(success(undefined));
  };
}
