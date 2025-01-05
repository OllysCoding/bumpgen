import "gsap";
import { fabric } from "fabric";

export interface VideoOverlay {
  title: string;
  subtitle?: string;
  episode?: string;
  description?: string;
  iconUrl?: string;
  start?: Date;
}

type FontStyle = "normal" | "italic" | "oblique";

export type ConverterFunc = (val: number) => number;
export type FabricTemplate = (
  overlay: VideoOverlay,
  helpers: {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    getFontProperties: (
      family: string,
      weight?: string,
      style?: FontStyle,
    ) =>
      | {}
      | { fontFamily: string; fontWeight?: string; fontStyle?: FontStyle };
    convertX: ConverterFunc;
    convertY: ConverterFunc;
  },
) => (
  fabricInstance: typeof fabric,
  canvas: fabric.StaticCanvas,
  anim: gsap.core.Timeline,
) => void;

export type BumpGenPlugin = (
  registerTemplate: (name: string, template: FabricTemplate) => void,
) => void;
