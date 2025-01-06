import { Readable, Writable } from "stream";
import * as fabric from "fabric/node";

type mediaPath = string;

export interface EncoderConfig {
  frameStream: Readable;
  output: mediaPath;
  width: number;
  height: number;
  backgroundVideo?: {
    videoPath: mediaPath;
    cut?: {
      startSeconds: number;
      endSeconds: number;
    };
    inSeconds: number;
    outSeconds: number;
  };
  fps: {
    input: number;
    output: number;
  };
}
interface EncoderOutput {
  path: mediaPath;
  stream: Writable;
}

type makeSceneFunction = (
  fabricInstance: typeof fabric,
  canvas: fabric.StaticCanvas,
  anim: gsap.core.Timeline,
  compose: () => void,
) => void;

export interface RendererConfig {
  width: number;
  height: number;
  fps: number;
  makeScene: makeSceneFunction;
}

export type Encoder = (config: EncoderConfig) => Promise<EncoderOutput>;
export type Renderer = (config: RendererConfig) => Promise<Readable>;
