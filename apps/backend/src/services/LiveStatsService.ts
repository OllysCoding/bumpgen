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
import { success } from "../result";
import { AppConfigService } from "./AppConfigService";
import type { JobSchedulerService } from "./JobSchedulerService";

type StatusEvent =
  | {
      status: "running";
      data: {
        channelId: string;
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
  lastRun: number;
}

type Event =
  | { name: "status"; event: StatusEvent }
  | { name: "stats"; event: StatsEvent };

@Service()
export class LiveStatsService implements BumpgenService {
  private _wss: WebSocketServer;

  public get wss() {
    return this._wss;
  }

  private lastStatsEvent: Event | undefined;

  constructor(
    public appConfigService: AppConfigService,
    public jobSchedulerService: JobSchedulerService,
  ) {
    this._wss = new WebSocketServer({ noServer: true });
  }

  public running = (channelId: string) => {
    const event: Event = {
      name: "status",
      event: {
        status: "running",
        data: {
          channelId,
        },
      },
    };
    this.emitEvent(event);
    this.lastStatsEvent = event;
  };

  public waiting = () => {
    const nextRun = this.jobSchedulerService.getNextRunTime("main")?.getTime();
    if (nextRun) {
      const event: Event = {
        name: "status",
        event: {
          status: "waiting",
          data: {
            nextRun,
          },
        },
      };
      this.emitEvent(event);
      this.lastStatsEvent = event;
    }
  };

  private emitEvent = (event: Event) => {
    this._wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  };

  private onConnect = (client: WebSocket) => {
    client.send(JSON.stringify(this.lastStatsEvent));
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
