import { Readable, Writable } from "stream";
import fabric from "fabric";

type mediaPath = string;

interface BaseConfig {
  silent?: boolean;
}

export interface EncoderConfig extends BaseConfig {
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
  fabricInstance: typeof fabric.fabric,
  canvas: fabric.fabric.StaticCanvas,
  anim: gsap.core.Timeline,
  compose: () => void,
) => void;

export interface RendererConfig extends BaseConfig {
  width: number;
  height: number;
  fps: number;
  makeScene: makeSceneFunction;
}

export type Encoder = (config: EncoderConfig) => Promise<EncoderOutput>;
export type Renderer = (config: RendererConfig) => Promise<Readable>;
