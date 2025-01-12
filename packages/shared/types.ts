import "gsap";
import * as fabric from "fabric/node";

export interface ProgrammeInfo {
  title: string;
  subtitle?: string;
  episode?: string;
  description?: string;
  iconUrl?: string;
  start?: Date;
  end?: Date;
}

type FontStyle = "normal" | "italic" | "oblique";
export type GetFontProperties = (
  family: string,
  weight?: string,
  style?: FontStyle,
) =>
  | Record<string, never>
  | { fontFamily: string; fontWeight?: string; fontStyle?: FontStyle };

export type ConverterFunc = (val: number) => number;
export type FabricTemplate = (
  programmes: [ProgrammeInfo, ...ProgrammeInfo[]],
  helpers: {
    getFontProperties: GetFontProperties;
    convertX: ConverterFunc;
    convertY: ConverterFunc;
  },
) => (
  fabricInstance: typeof fabric,
  canvas: fabric.StaticCanvas,
  anim: gsap.core.Timeline,
) => Promise<void>;

export type BumpGenPlugin = (
  registerTemplate: (name: string, template: FabricTemplate) => void,
) => void;
