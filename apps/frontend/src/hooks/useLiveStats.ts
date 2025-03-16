import { useCallback, useEffect, useState } from "react";
import { V1_API_BASE } from "../utils/constants";
import { App } from "antd";

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

export interface ChannelResult {
  duration: number;
  result: "generated" | "up-to-date" | "error" | "not-configured";
}

interface StatsEvent {
  lastRun: {
    time: number;
    channelIds: string[];
    channelResults: Record<string, ChannelResult>;
  };
}

type Event =
  | { name: "status"; event: StatusEvent; id: number }
  | { name: "stats"; event: StatsEvent; id: number };

type UseLiveStats = () => {
  stats: StatsEvent | undefined;
  latestStatus: StatusEvent | undefined;
};

export const useLiveStats: UseLiveStats = () => {
  const app = App.useApp();

  const [eventQueue, setEventQueue] = useState<Event[]>([]);
  const [stats, setStats] = useState<StatsEvent | undefined>(undefined);
  const [statsId, setStatsId] = useState<number>(0);
  const [latestStatus, setLatestStatus] = useState<StatusEvent | undefined>(
    undefined,
  );
  const [latestStatusId, setLatestStatusId] = useState<number>(0);

  const onEvent = useCallback(
    (event: unknown) => {
      if (typeof event !== "string") {
        console.error(`Unknown message receiced:`, event);
        return app.message.warning(
          "Received unknown message from server, see more in console",
        );
      }

      try {
        const parsedEvent: Event = JSON.parse(event);
        if (parsedEvent.name === "stats" || parsedEvent.name === "status") {
          console.log("Setting event to queue", parsedEvent);
          setEventQueue((prev) => prev.concat([parsedEvent]));
        } else {
          throw new Error("No matching event name");
        }
      } catch (err) {
        console.error(
          "Unknown error occurred while parsing message from server",
          err,
          event,
        );
        return app.message.warning(
          "failed to parse message from server, see more in console",
        );
      }
    },
    [app.message],
  );

  useEffect(() => {
    console.log("creating new socket...");
    const socket = new WebSocket(`${V1_API_BASE}/ws`);

    socket.onmessage = function (event) {
      if (typeof event.data === "string") {
        onEvent(event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [onEvent]);

  useEffect(() => {
    if (eventQueue.length === 0) {
      return;
    }

    console.log("Looping event queue", eventQueue);

    let localStatsId = statsId;
    let localLatestStatusId = latestStatusId;
    let localStats: StatsEvent | undefined = undefined;
    let localLatestStatus: StatusEvent | undefined = undefined;
    eventQueue.forEach((event) => {
      switch (event.name) {
        case "stats": {
          if (event.id > localStatsId) {
            localStats = event.event;
            localStatsId = event.id;
          }
          break;
        }
        case "status": {
          if (event.id > localLatestStatusId) {
            localLatestStatus = event.event;
            localLatestStatusId = event.id;
          }
          break;
        }
      }
    });

    if (localStats) {
      setStats(localStats);
    }
    if (localLatestStatus) {
      setLatestStatus(localLatestStatus);
    }
    if (localStatsId !== statsId) {
      setStatsId(localStatsId);
    }
    if (localLatestStatusId !== latestStatusId) {
      setLatestStatusId(localLatestStatusId);
    }

    const processedEvents = new Set(eventQueue.map((event) => event.id));

    // Queue is cleared
    setEventQueue((prevQueue) =>
      prevQueue.filter((item) => !processedEvents.has(item.id)),
    );
  }, [eventQueue, latestStatusId, statsId]);

  return {
    stats,
    latestStatus,
  };
};
