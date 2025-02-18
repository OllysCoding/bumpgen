import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { ApiErrorType } from "./errors.js";
import { Container } from "typedi";
import { AppConfigService } from "../../services/AppConfigService.js";

const pluginCallback: FastifyPluginCallback = (fastify, options, done) => {
  fastify.addHook("onRequest", (request, reply, done) => {
    if (!Container.get(AppConfigService).isInitialized) {
      reply.sendError(ApiErrorType.APP_NOT_INITIALIZED);
    } else {
      done();
    }
  });

  done();
};

export default fp(pluginCallback, {
  encapsulate: true,
  decorators: {
    reply: ["sendError"],
  },
});
