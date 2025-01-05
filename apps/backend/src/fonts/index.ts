import { glob } from "glob";
import { appConfig, configFilePath } from "../config/app.js";
import path from "path";
import Ajv, { type JSONSchemaType } from "ajv";
import { readFile } from "fs/promises";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { registerFont } from "canvas";
import type { GetFontProperties } from "bumpgen-shared/types";

const ajv = new Ajv();

interface FontMap {
  family: string;
  files: Record<
    string,
    {
      weight?: string;
      style?: "normal" | "italic" | "oblique";
    }
  >;
}

const schema: JSONSchemaType<FontMap> = {
  type: "object",
  properties: {
    family: { type: "string" },
    files: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          weight: { type: "string", nullable: true },
          style: { type: "string", nullable: true },
        },
        required: [],
      },
      required: [],
    },
  },
  required: ["family", "files"],
};

const validate = ajv.compile(schema);

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export abstract class Fonts {
  private static _fonts: Record<
    string,
    {
      family: string;
      weight: string;
      style: "normal" | "italic" | "oblique";
    }[]
  > = {};

  static getFontProperties(
    family: string,
    weight?: string,
    style?: string,
  ): ReturnType<GetFontProperties> {
    const weightOrDefault = weight ?? "normal";
    const styleOrDefault = style ?? "normal";

    if (!this._fonts[family]) {
      return {};
    }

    const font = this._fonts[family]?.find(
      (props) =>
        props.weight === weightOrDefault && props.style === styleOrDefault,
    );

    if (!font) {
      return {
        fontFamily: family,
      };
    } else {
      return {
        fontFamily: family,
        fontStyle: font.style,
        fontWeight: font.weight,
      };
    }
  }

  static async registerFonts() {
    const defaultFiles = await glob("./fonts/**/font-map.json", {
      absolute: true,
    });
    const pluginFiles = appConfig.experimentalPluginsSupport
      ? await glob(path.join(configFilePath, "/plugins/**/font-map.json"), {
          absolute: true,
        })
      : [];

    const allFiles = new Set([...defaultFiles, ...pluginFiles]);
    for (const file of allFiles) {
      logDebug(`Starting to parse font map at ${file}`);
      try {
        const value = await readFile(file, "utf-8");
        const parsed = JSON.parse(value);

        if (validate(parsed)) {
          const folderPath = file.replace("/font-map.json", "");
          for (const [fontFileName, properties] of Object.entries(
            parsed.files,
          )) {
            const fontFilePath = path.join(folderPath, fontFileName);
            logDebug(`Attempting to import font at ${fontFilePath}`);
            try {
              const parsedProperties = {
                family: parsed.family,
                weight: properties.weight ?? "normal",
                style: properties.style ?? "normal",
              };
              registerFont(fontFilePath, parsedProperties);
              if (!this._fonts[parsed.family]) this._fonts[parsed.family] = [];
              this._fonts[parsed.family]?.push(parsedProperties);
              logInfo(`Successfully registered font from ${fontFilePath}`);
            } catch (err) {
              logError(
                `Encountered errors when registering font at ${fontFilePath}`,
                err,
              );
            }
          }
        } else {
          logError(
            `Encountered errors when parsing font map at ${file}`,
            validate.errors,
          );
        }
      } catch (err) {
        logError(`Encountered error when parsing font map at ${file}`, err);
      }
    }
  }
}
