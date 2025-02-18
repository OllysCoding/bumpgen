import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

export enum ApiErrorType {
  APP_NOT_INITIALIZED = 100,
  APP_ALREADY_INITIALIZED = 101,
  UNABLE_TO_INITIALIZE = 102,
  UNABLE_TO_ADD_RESOURCE = 200,
  UNABLE_TO_UPDATE_RESOURCE = 201,
}

declare module "fastify" {
  interface FastifyReply {
    sendError: (errorType: ApiErrorType, errorSpecifics?: unknown) => void;
  }
}

const pluginCallback: FastifyPluginCallback = (fastify, options, done) => {
  fastify.decorateReply(
    "sendError",
    function (errorType: ApiErrorType, errorSpecifics: unknown) {
      const baseError = {
        error: true,
        code: errorType,
        errorSpecifics,
      };

      switch (errorType) {
        case ApiErrorType.APP_NOT_INITIALIZED: {
          this.status(500).send({
            ...baseError,
            message: "App is not initialized",
          });
          break;
        }
        case ApiErrorType.APP_ALREADY_INITIALIZED: {
          this.status(500).send({
            ...baseError,
            message: "App is already initialized",
          });
          break;
        }
        case ApiErrorType.UNABLE_TO_INITIALIZE: {
          this.status(500).send({
            ...baseError,
            message: "Failed to initialize app",
          });
          break;
        }
        case ApiErrorType.UNABLE_TO_ADD_RESOURCE: {
          this.status(500).send({
            ...baseError,
            message: "Unable to add resource",
          });
          break;
        }
        case ApiErrorType.UNABLE_TO_UPDATE_RESOURCE: {
          this.status(500).send({
            ...baseError,
            message: "Unable to update resource",
          });
          break;
        }
      }
    },
  );

  done();
};

export default fp(pluginCallback);
