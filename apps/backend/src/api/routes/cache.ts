import type { FastifyInstance /* FastifyRegisterOptions */ } from "fastify";

import { type Static, Type } from "@sinclair/typebox";
import { Container } from "typedi";
import { XmlTvService } from "../../services/XmlTvService.js";
import { BackgroundContentService } from "../../services/BackgroundContentService.js";
import { TemplatesService } from "../../services/TemplatesService.js";
import { unwrap } from "../../result/index.js";

const CacheDataSchema = Type.Object({
  channels: Type.Array(
    Type.Object({
      name: Type.String(),
      id: Type.String(),
    }),
  ),
  backgroundContent: Type.Array(
    Type.Object({
      fullPath: Type.String(),
      relativePath: Type.String(),
      length: Type.Number(),
    }),
  ),
  templates: Type.Array(
    Type.Object({
      name: Type.String(),
    }),
  ),
});

type CacheData = Static<typeof CacheDataSchema>;

const routes = async (
  fastify: FastifyInstance,
  // options: FastifyRegisterOptions<never>,
) => {
  fastify.get<{ Reply: CacheData }>(
    "/",
    { schema: { response: { 200: CacheDataSchema } } },
    (request, reply) => {
      const xmlTvService = Container.get(XmlTvService);
      const backgroundContentService = Container.get(BackgroundContentService);
      const templatesService = Container.get(TemplatesService);

      reply.status(200).send({
        channels: xmlTvService.channels.map((channel) => ({
          name:
            unwrap(
              xmlTvService.getValueForConfiguredLang(channel.displayName),
            ) || "unknown",
          id: channel.id,
        })),
        backgroundContent: backgroundContentService.files.map(
          ({ fullPath, relativePath, length }) => ({
            fullPath,
            relativePath,
            length,
          }),
        ),
        templates: Object.keys(templatesService.templates).map((name) => ({
          name,
        })),
      });
    },
  );
};

export default routes;
