import path from "node:path";
import { logDebug, logError, logInfo } from "../logger/index.js";
import { failure, success, type Result } from "../result/index.js";
import type { VideoOverlay } from "../video-generator/index.js";
import fabric from "fabric";
import { glob } from "glob";

import { create, createEsmHooks, type NodeLoaderHooksAPI2 } from 'ts-node'
import { assert } from "node:console";
import { appConfig, configFilePath } from "../config/app.js";

const tsNode = create();
const esmHooks = createEsmHooks(tsNode) as NodeLoaderHooksAPI2;

assert(
  typeof esmHooks.load === 'function', 
  'Wrong ts-node NodeLoaderHooksApi, are you using the correct node version?'
);

export type ConverterFunc = (val: number) => number;
export type FabricTemplate = (
  overlay: VideoOverlay,
  convertX: ConverterFunc,
  convertY: ConverterFunc,
) => (
  fabricInstance: typeof fabric.fabric,
  canvas: fabric.fabric.StaticCanvas,
  anim: gsap.core.Timeline,
) => void;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export abstract class Templates {
  private static _templates: Record<string, FabricTemplate> = {};
  private static _failedTemplateFiles: Record<string, unknown> = {};
  public static get templates() {
    return this._templates
  }

  static registerTemplates = async (): Promise<Result<string[]>> => {
    try {
      const defaultFiles = await glob('templates/*.ts');
      const pluginFiles = appConfig.experimentalPluginsSupport 
        ? await glob(path.join(configFilePath, '/plugins/**/plugin.ts'))
        : [];
      
      const allFiles = new Set([...defaultFiles, ...pluginFiles]);
      const loadedFiles = new Set<string>();

      for (const file of allFiles) {
        try { 
          logDebug(`Starting to load file "${file}"`);
          const currentCount = Object.keys(this._templates).length
          await esmHooks.load(file, { format: 'module' }, esmHooks.load);
          const newCount = Object.keys(this._templates).length
          if (newCount >= currentCount) {
            loadedFiles.add(file);
            logInfo(`Loaded ${newCount - currentCount} templates from file "${file}"`)
          } else {
            logInfo(`Loaded file "${file}" but no templates have been registered`)
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
  }

  static registerTemplate = (name: string, template: FabricTemplate): void => {
    if (this._templates[name]) {
      logError(`Failed to register template ${name}, already exists.`)
      return;
    }
    this._templates[name] = template
  }

  static getTemplateByName = (name: string): Result<FabricTemplate> => {
    const maybeTemplate = this._templates[name]
    if (maybeTemplate) {
      return success(maybeTemplate);
    } else {
      return failure(`Template with ${name} does not exist or is not registered`);
    }
  }
}

// TODO: Import these automagically
// import './centre-title-and-time.js'

