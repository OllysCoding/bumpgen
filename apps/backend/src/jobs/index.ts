import { scheduleJob, type Job, type JobCallback } from "node-schedule";

import MainJob from "./main.js";

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

class JobScheduler {
  private scheduledJobs: Record<JobName, Job | undefined> = {
    main: undefined,
  };

  startJob = (name: JobName) => {
    if (this.scheduledJobs[name]) {
      this.scheduledJobs[name].reschedule(jobMap[name].getSchedule());
    } else {
      this.scheduledJobs[name] = scheduleJob(
        jobMap[name].getSchedule(),
        jobMap[name].job,
      );
    }
  };

  startup = () => {
    this.startJob("main");
  };
}

export const jobScheduler = new JobScheduler();
