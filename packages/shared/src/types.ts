
import 'gsap'
import { fabric } from "fabric";

export interface VideoOverlay {
  title: string;
  subtitle?: string;
  episode?: string;
  description?: string;
  iconUrl?: string;
  start?: Date;
}

export type ConverterFunc = (val: number) => number;
export type FabricTemplate = (
  overlay: VideoOverlay,
  convertX: ConverterFunc,
  convertY: ConverterFunc,
) => (
  fabricInstance: typeof fabric,
  canvas: fabric.StaticCanvas,
  anim: gsap.core.Timeline,
) => void;

export type BumpGenPlugin = (registerTemplate: (name: string, template: FabricTemplate) => void) => void;