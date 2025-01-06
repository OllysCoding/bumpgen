import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import { type Encoder } from "./types.js";
import { logError } from "../logger/index.js";

const createDir = (
  reject: (reason?: Error) => void,
  output: string,
) => {
  try {
    const outDir = path.dirname(output);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  } catch (e) {
    logError("Cannot create/access output directory", e);
    reject(new Error("Cannot create/access output directory"));
  }
};

const createFilter = (backgroundVideo: {
  inSeconds: number;
  outSeconds: number;
}) => {
  const { inSeconds, outSeconds } = backgroundVideo;
  return [
    "[1:v]setpts=PTS+" + inSeconds + "/TB[out]",
    "[0]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1[a]",
    {
      filter: "overlay",
      options: {
        enable: "between(t," + inSeconds + "," + outSeconds + ")",
        x: "0",
        y: "0",
      },
      inputs: ["a", "out"],
      outputs: "tmp",
    },
  ];
};

const outputOptions = [
  "-preset veryfast",
  "-crf 24",
  "-f mp4",
  "-vcodec libx264",
  "-movflags frag_keyframe+empty_moov",
  "-pix_fmt yuv420p",
];

const encoder: Encoder = (config) =>
  new Promise((resolve, reject) => {
    const { frameStream, output, backgroundVideo, fps } = config;
    createDir(reject, output);

    const outputStream = fs.createWriteStream(output);
    const command = ffmpeg();

    if (backgroundVideo) {
      command.input(backgroundVideo.videoPath);
      if (backgroundVideo.cut) {
        command.seekInput(backgroundVideo.cut.startSeconds);
        command.withDuration(
          backgroundVideo.cut.endSeconds - backgroundVideo.cut.startSeconds,
        );
      }
    }

    command.input(frameStream).inputFPS(fps.input);
    command.outputOptions(outputOptions);
    command.fps(fps.output);

    if (backgroundVideo)
      command.complexFilter([...createFilter(backgroundVideo)], "tmp");

    command.output(outputStream);

    command.on("end", () => {
      resolve({ path: output, stream: outputStream });
    });

    command.on("error", (err: Error) => {
      reject(new Error(err.message));
    });

    command.run();
  });

export default encoder;
