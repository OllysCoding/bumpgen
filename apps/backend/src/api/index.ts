import Fastify from "fastify";

import errorsPlugin from "./plugins/errors.js";
import isInitiliazedPlugin from "./plugins/isInitiliazed.js";

import settingsRoutes from "./routes/settings.js";
import cacheRoutes from "./routes/cache.js";
import initializeRoutes from "./routes/initialize.js";
import { Container } from "typedi";
import { LiveStatsService } from "../services/LiveStatsService.js";

const V1_API_BASE = "/api/v1";

export const initializeApi = async () => {
  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  fastify.register(errorsPlugin);

  // Register routers that can be accessed pre-initialization
  fastify.register(initializeRoutes, { prefix: `${V1_API_BASE}/initialize` });

  fastify.register(isInitiliazedPlugin, (fastifyWithAppInitialized) => {
    // Register routes
    fastifyWithAppInitialized.register(settingsRoutes, {
      prefix: `${V1_API_BASE}/settings`,
    });
    fastifyWithAppInitialized.register(cacheRoutes, {
      prefix: `${V1_API_BASE}/cache`,
    });
  });

  fastify.server.on("upgrade", (req, socket, head) => {
    console.log("HELLO WORLD!");
    console.log(req.url);
    if (req.url === "/api/v1/ws") {
      Container.get(LiveStatsService).wss.handleUpgrade(
        req,
        socket,
        head,
        function done(ws) {
          Container.get(LiveStatsService).wss.emit("connection", ws, req);
        },
      );
    }
  });

  await fastify.listen({ port: 4000 });
};
