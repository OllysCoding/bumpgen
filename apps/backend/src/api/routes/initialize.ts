import type { FastifyInstance /* FastifyRegisterOptions */ } from "fastify";
import { type Static, Type } from "@sinclair/typebox";
import { ApiErrorType } from "../plugins/errors.js";
import { isFailure } from "../../result/index.js";
import { Container } from "typedi";
import { AppConfigService } from "../../services/AppConfigService.js";

const InitializeSchema = Type.Object({
  xmlTvUrl: Type.String(),
  language: Type.String(),
  outputFolder: Type.String(),
  backgroundContentFolder: Type.String(),
});

type InitializeSchema = Static<typeof InitializeSchema>;

const routes = async (
  fastify: FastifyInstance,
  // options: FastifyRegisterOptions<never>,
) => {
  fastify.get("/", () => {
    const appConfigService = Container.get(AppConfigService);
    return {
      isInitialized: appConfigService.isInitialized,
    };
  });

  fastify.post<{ Body: InitializeSchema }>(
    "/",
    { schema: { body: InitializeSchema } },
    async (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      if (appConfigService.isInitialized) {
        reply.sendError(ApiErrorType.APP_ALREADY_INITIALIZED);
      } else {
        const result = await appConfigService.initializeFromDefaults(
          request.body.xmlTvUrl,
          request.body.language,
          request.body.outputFolder,
          request.body.backgroundContentFolder,
        );

        if (isFailure(result)) {
          reply.sendError(
            ApiErrorType.UNABLE_TO_INITIALIZE,
            result.error.message,
          );
        } else {
          reply.status(200).send(appConfigService.config);
        }
      }
    },
  );
};

export default routes;
