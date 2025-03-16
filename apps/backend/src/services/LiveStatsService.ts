import { WebSocketServer, WebSocket } from "ws";
/**
 *
 * LiveStatsService
 *
 * WS communicates status
 * status:
 * 1. waiting: time till next run
 * 2. running: channel, task
 *
 * stats:
 * last run: time taken, videos taken
 * per channel: avg time taken
 */

import { Service } from "typedi";
import type { BumpgenService } from "./types";
import { success } from "../result/index.js";
import { AppConfigService } from "./AppConfigService.js";
import { JobSchedulerService } from "./JobSchedulerService.js";
import { XmlTvService } from "./XmlTvService.js";

type StatusEvent =
  | {
      status: "starting"; // Fetching XML TV Data
      data: Record<string, never>;
    }
  | {
      status: "running";
      data: {
        numChannels: number;
        channelIndex: number;
        channelId: string;
        task: "starting" | "generating";
      };
    }
  | {
      status: "waiting";
      data: {
        // iso time
        nextRun: number;
      };
    };

interface StatsEvent {
  lastRun: {
    time: number;
    channelIds: string[];
    channelResults: Record<
      string,
      {
        duration: number;
        result: "generated" | "up-to-date" | "error" | "not-configured";
      }
    >;
  };
}

type Event =
  | { name: "status"; event: StatusEvent; id: number }
  | { name: "stats"; event: StatsEvent; id: number };

@Service()
export class LiveStatsService implements BumpgenService {
  private _wss: WebSocketServer;

  public get wss() {
    return this._wss;
  }

  private idCount = 0;

  private latestStatusEvent: StatusEvent | undefined;
  private latestStatsEvent: StatsEvent | undefined;

  constructor(
    public appConfigService: AppConfigService,
    public jobSchedulerService: JobSchedulerService,
    public xmlTvService: XmlTvService,
  ) {
    this._wss = new WebSocketServer({ noServer: true });
  }

  public channelResult = (
    channelId: string,
    duration: number,
    result: "generated" | "up-to-date" | "error" | "not-configured",
  ) => {
    const event: StatsEvent = this.latestStatsEvent ?? {
      lastRun: {
        time: new Date().getTime(),
        channelIds: this.xmlTvService.channels.map((c) => c.id),
        channelResults: {},
      },
    };

    this.emitStatsEvent({
      ...event,
      lastRun: {
        ...event.lastRun,
        channelResults: {
          ...event.lastRun.channelResults,
          [channelId]: {
            duration,
            result,
          },
        },
      },
    });
  };

  public xmlTvFetched = () => {
    if (this.latestStatsEvent) {
      this.emitStatsEvent({
        ...this.latestStatsEvent,
        lastRun: {
          ...this.latestStatsEvent.lastRun,
          channelIds: this.xmlTvService.channels.map((c) => c.id),
        },
      });
    }
  };

  public start = () => {
    this.emitStatusEvent({
      status: "starting",
      data: {},
    });

    this.emitStatsEvent({
      lastRun: {
        time: new Date().getTime(),
        channelIds: this.xmlTvService.channels.map((c) => c.id),
        channelResults: {},
      },
    });
  };

  public running = (channelId: string, task: "generating" | "starting") => {
    this.emitStatusEvent({
      status: "running",
      data: {
        numChannels: this.xmlTvService.channels.length,
        channelIndex: this.xmlTvService.channels.findIndex(
          (c) => c.id === channelId,
        ),
        channelId,
        task,
      },
    });
  };

  public waiting = () => {
    const nextRun = this.jobSchedulerService.getNextRunTime("main")?.getTime();
    if (nextRun) {
      this.emitStatusEvent({
        status: "waiting",
        data: {
          nextRun,
        },
      });
    }
  };

  private getNextId = () => {
    this.idCount += 1;
    return this.idCount;
  };

  private emitStatusEvent = (event: StatusEvent, saveAsLatest = true) => {
    this.emitEvent({
      name: "status",
      id: this.getNextId(),
      event,
    });
    if (saveAsLatest) this.latestStatusEvent = event;
  };

  private emitStatsEvent = (event: StatsEvent, saveAsLatest = true) => {
    this.emitEvent({
      name: "stats",
      id: this.getNextId(),
      event,
    });
    if (saveAsLatest) this.latestStatsEvent = event;
  };

  private emitEvent = (event: Event) => {
    this._wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  };

  private onConnect = (client: WebSocket) => {
    if (this.latestStatusEvent) {
      const event: Event = {
        name: "status",
        id: 0,
        event: this.latestStatusEvent,
      };
      client.send(JSON.stringify(event));
    }
    if (this.latestStatsEvent) {
      const event: Event = {
        name: "stats",
        id: 1,
        event: this.latestStatsEvent,
      };
      client.send(JSON.stringify(event));
    }
  };

  load = () => {
    this._wss.addListener("connection", this.onConnect);
    return Promise.resolve(success(undefined));
  };
  unload = () => {
    this._wss.removeAllListeners("connection");
    return Promise.resolve(success(undefined));
  };
  run = () => {
    return Promise.resolve(success(undefined));
  };
}
