import path from "node:path";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { failure, success, type Result } from "../result/index.js";
import { glob } from "glob";

import type { FabricTemplate } from "bumpgen-shared/types";
import { Service } from "typedi";
import { configFilePath, AppConfigService } from "./AppConfigService.js";

@Service()
export class TemplatesService {
  private _templates: Record<string, FabricTemplate> = {};
  private _failedTemplateFiles: Record<string, unknown> = {};
  public get templates() {
    return this._templates;
  }

  constructor(public appConfigService: AppConfigService) {}

  private registerTemplates = async (): Promise<Result<string[]>> => {
    try {
      const defaultFiles = await glob("../../dist/templates/src/*.js", {
        absolute: true,
      });
      const pluginFiles = this.appConfigService.config
        .experimentalPluginsSupport
        ? await glob(path.join(configFilePath, "/plugins/**/plugin.js"), {
            absolute: true,
          })
        : [];

      const allFiles = new Set([...defaultFiles, ...pluginFiles]);
      const loadedFiles = new Set<string>();

      for (const file of allFiles) {
        logDebug(`Starting to load file "${file}"`);
        try {
          const currentCount = Object.keys(this._templates).length;

          const module = await import(file);

          if (!module || !module.load || typeof module.load !== "function") {
            throw new Error('Does not export a "load" function');
          }

          module.load(this.registerTemplate);

          const newCount = Object.keys(this._templates).length;
          if (newCount >= currentCount) {
            loadedFiles.add(file);
            logInfo(
              `Loaded ${newCount - currentCount} templates from file "${file}"`,
            );
          } else {
            logInfo(
              `Loaded file "${file}" but no templates have been registered`,
            );
          }
        } catch (err) {
          this._failedTemplateFiles[file] = err;
          logError(`Failed to load plugin at "${file}"`, err);
        }
      }

      return success(Array.from(loadedFiles));
    } catch (err) {
      logError(`Unknown error when loading plugins`, err);
      return failure("Unknown error when loading plugins", err);
    }
  };

  private registerTemplate = (name: string, template: FabricTemplate): void => {
    if (this._templates[name]) {
      logError(`Failed to register template ${name}, already exists.`);
      return;
    }
    this._templates[name] = template;
  };

  public getTemplateByName = (name: string): Result<FabricTemplate> => {
    const maybeTemplate = this._templates[name];
    if (maybeTemplate) {
      return success(maybeTemplate);
    } else {
      return failure(
        `Template with ${name} does not exist or is not registered`,
      );
    }
  };

  private onInitialized = async () => {
    await this.registerTemplates();
  };

  public load = async () => {
    this.appConfigService.addEventListener("onInitialized", this.onInitialized);

    if (this.appConfigService.isInitialized) {
      try {
        const result = await this.registerTemplates();
        return result;
      } catch (err) {
        failure("Failed to register templates", err);
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
