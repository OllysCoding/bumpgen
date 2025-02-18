import { glob } from "glob";
import path from "path";
import Ajv, { type JSONSchemaType } from "ajv";
import { readFile } from "fs/promises";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { registerFont } from "canvas";
import type { GetFontProperties } from "bumpgen-shared/types";
import type { BumpgenService } from "./types.js";
import { Service } from "typedi";
import { failure, success } from "../result/index.js";
import { configFilePath, AppConfigService } from "./AppConfigService.js";

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

@Service()
export class FontsService implements BumpgenService {
  private _fonts: Record<
    string,
    {
      family: string;
      weight: string;
      style: "normal" | "italic" | "oblique";
    }[]
  > = {};

  constructor(public appConfigService: AppConfigService) {}

  public getFontProperties = (
    family: string,
    weight?: string,
    style?: string,
  ): ReturnType<GetFontProperties> => {
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
  };

  public registerFonts = async () => {
    const defaultFiles = await glob("./fonts/**/font-map.json", {
      absolute: true,
    });
    const pluginFiles = this.appConfigService.config.experimentalPluginsSupport
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
              await registerFont(fontFilePath, parsedProperties);
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
  };

  private onInitialized = () => this.registerFonts();

  public load = async () => {
    console.log(this.appConfigService);
    this.appConfigService.addEventListener("onInitialized", this.onInitialized);

    if (this.appConfigService.isInitialized) {
      try {
        await this.registerFonts();
      } catch (err) {
        failure("Failed to register fonts", err);
      }
    }

    return success(undefined);
  };

  public unload = () => {
    this.appConfigService.removeEventListener(
      "onInitialized",
      this.onInitialized,
    );

    return Promise.resolve(success(undefined));
  };

  public run = () => {
    // Do Nothing
    return Promise.resolve(success(undefined));
  };
}
