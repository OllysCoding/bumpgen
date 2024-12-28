import type { VideoOverlay } from "../index.js";
import fabric from "fabric";

export type ConverterFunc = (val: number) => number;
export type FabricTemplate = 
  (overlay: VideoOverlay, convertX: ConverterFunc, convertY: ConverterFunc) => 
    (fabricInstance: typeof fabric.fabric, canvas: fabric.fabric.StaticCanvas, anim: gsap.core.Timeline) =>
      void;
