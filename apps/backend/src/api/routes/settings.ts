import type { FastifyInstance /* FastifyRegisterOptions */ } from "fastify";
import { isFailure } from "../../result/index.js";
import { ApiErrorType } from "../plugins/errors.js";
import { type Static, Type } from "@sinclair/typebox";
import {
  AppConfigSchema,
  AppConfigService,
  BackgroundContentConfigSchema,
  ChannelConfigSchema,
  type AppConfig,
  type ChannelConfig,
} from "../../services/AppConfigService.js";
import { Container } from "typedi";

const UpdateChannelConfigSchema = Type.Object({
  index: Type.Number(),
  channelConfig: ChannelConfigSchema,
});

type UpdateChannelConfig = Static<typeof UpdateChannelConfigSchema>;

const AddOrUpdateBackgroundContentConfigSchema = Type.Object({
  filePath: Type.String(),
  backgroundContentConfig: BackgroundContentConfigSchema,
});

type AddOrUpdateBackgroundContentConfig = Static<
  typeof AddOrUpdateBackgroundContentConfigSchema
>;

const SettingsSchema = Type.Pick(AppConfigSchema, [
  "backgroundContentFolder",
  "experimentalPluginsSupport",
  "interval",
  "logLevel",
  "language",
  "outputFolder",
  "xmlTvUrl",
]);

type Settings = Static<typeof SettingsSchema>;

const routes = async (
  fastify: FastifyInstance,
  // options: FastifyRegisterOptions<never>,
) => {
  fastify.get<{ Reply: Settings }>(
    "/",
    { schema: { response: { 200: SettingsSchema } } },
    (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      reply.status(200).send({
        logLevel: appConfigService.config.logLevel,
        xmlTvUrl: appConfigService.config.xmlTvUrl,
        interval: appConfigService.config.interval,
        language: appConfigService.config.language,
        experimentalPluginsSupport:
          appConfigService.config.experimentalPluginsSupport,
        outputFolder: appConfigService.config.outputFolder,
        backgroundContentFolder:
          appConfigService.config.backgroundContentFolder,
      });
    },
  );

  fastify.post<{ Body: Settings; Reply: Settings }>(
    "/",
    { schema: { body: SettingsSchema, response: { 200: SettingsSchema } } },
    async (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      const result = await appConfigService.updateSettings(request.body);
      if (isFailure(result)) {
        return reply.sendError(
          ApiErrorType.UNABLE_TO_UPDATE_RESOURCE,
          result.error.message,
        );
      } else {
        reply.status(200).send({
          logLevel: appConfigService.config.logLevel,
          xmlTvUrl: appConfigService.config.xmlTvUrl,
          interval: appConfigService.config.interval,
          language: appConfigService.config.language,
          experimentalPluginsSupport:
            appConfigService.config.experimentalPluginsSupport,
          outputFolder: appConfigService.config.outputFolder,
          backgroundContentFolder:
            appConfigService.config.backgroundContentFolder,
        });
      }
    },
  );

  fastify.get<{ Reply: AppConfig["channels"] }>(
    "/channel-configs",
    { schema: { response: { 200: AppConfigSchema.properties.channels } } },
    (request, reply) => {
      reply.status(200).send(Container.get(AppConfigService).config.channels);
    },
  );

  fastify.post<{ Body: ChannelConfig; Reply: AppConfig["channels"] }>(
    "/channel-configs/create",
    {
      schema: {
        body: ChannelConfigSchema,
        response: { 200: AppConfigSchema.properties.channels },
      },
    },
    async (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      const result = await appConfigService.addChannelConfig(request.body);
      if (isFailure(result)) {
        reply.sendError(
          ApiErrorType.UNABLE_TO_ADD_RESOURCE,
          result.error.message,
        );
      } else {
        reply.status(200).send(appConfigService.config.channels);
      }
    },
  );

  fastify.post<{ Body: UpdateChannelConfig; Reply: AppConfig["channels"] }>(
    "/channel-configs/update",
    {
      schema: {
        body: UpdateChannelConfigSchema,
        response: { 200: AppConfigSchema.properties.channels },
      },
    },
    async (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      const result = await appConfigService.updateChannelConfig(
        request.body.index,
        request.body.channelConfig,
      );
      if (isFailure(result)) {
        reply.sendError(
          ApiErrorType.UNABLE_TO_UPDATE_RESOURCE,
          result.error.message,
        );
      } else {
        reply.status(200).send(appConfigService.config.channels);
      }
    },
  );

  fastify.get<{ Reply: AppConfig["backgroundContent"] }>(
    "/background-content-configs",
    {
      schema: {
        response: { 200: AppConfigSchema.properties.backgroundContent },
      },
    },
    (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      reply.status(200).send(appConfigService.config.backgroundContent ?? {});
    },
  );

  fastify.post<{
    Body: AddOrUpdateBackgroundContentConfig;
    Reply: AppConfig["backgroundContent"];
  }>(
    "/background-content-configs/create",
    {
      schema: {
        body: AddOrUpdateBackgroundContentConfigSchema,
        response: { 200: AppConfigSchema.properties.backgroundContent },
      },
    },
    async (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      const result = await appConfigService.addBackgroundContentConfig(
        request.body.filePath,
        request.body.backgroundContentConfig,
      );
      if (isFailure(result)) {
        reply.sendError(
          ApiErrorType.UNABLE_TO_ADD_RESOURCE,
          result.error.message,
        );
      } else {
        reply.status(200).send(appConfigService.config.backgroundContent);
      }
    },
  );

  fastify.post<{
    Body: AddOrUpdateBackgroundContentConfig;
    Reply: AppConfig["backgroundContent"];
  }>(
    "/background-content-configs/update",
    {
      schema: {
        body: AddOrUpdateBackgroundContentConfigSchema,
        response: { 200: AppConfigSchema.properties.backgroundContent },
      },
    },
    async (request, reply) => {
      const appConfigService = Container.get(AppConfigService);
      const result = await appConfigService.updateBackgroundContentConfig(
        request.body.filePath,
        request.body.backgroundContentConfig,
      );
      if (isFailure(result)) {
        reply.sendError(
          ApiErrorType.UNABLE_TO_ADD_RESOURCE,
          result.error.message,
        );
      } else {
        reply.status(200).send(appConfigService.config.backgroundContent);
      }
    },
  );
};

export default routes;
