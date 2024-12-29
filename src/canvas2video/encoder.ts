import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import * as cliProgress from "cli-progress";
import { type Encoder } from "./types.js";
import { logError } from "../logger/index.js";

const progressBar = new cliProgress.SingleBar({
    format: `Processing | {bar} | {percentage}%`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
});

const createDir = (reject: (reason?: Error) => void, silent: boolean, output: string) => {
    try {
        const outDir = path.dirname(output);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
    } catch (e) {
        logError('Cannot create/access output directory', e)
        reject(new Error("Cannot create/access output directory"));
    }
};

const createFilter = (backgroundVideo: { inSeconds: number; outSeconds: number }) => {
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
            inputs: ['a', 'out'],
            outputs: "tmp",
        },
    ];
};

const percent: (percent?: number) => number = (percent) =>
    percent ? parseFloat((percent as number).toFixed(2)) : 0;

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
        const { frameStream, output, backgroundVideo, fps, silent = true } = config;
        createDir(reject, silent, output);

        const outputStream = fs.createWriteStream(output);
        const command = ffmpeg();

        if (backgroundVideo) {
            command.input(backgroundVideo.videoPath);
            if (backgroundVideo.cut) {
                command.seekInput(backgroundVideo.cut.startSeconds);
                command.withDuration(backgroundVideo.cut.endSeconds - backgroundVideo.cut.startSeconds);
            }
        }

        command.input(frameStream).inputFPS(fps.input);
        command.outputOptions(outputOptions);
        command.fps(fps.output);

        if (backgroundVideo) command.complexFilter([
            ...createFilter(backgroundVideo),
        ], "tmp");

        command.output(outputStream);
        // command.size(`${width}x${height}`);

        command.on("start", () => {
            if (!silent) progressBar.start(100, 0);
        });

        command.on("end", () => {
            if (!silent) progressBar.stop();
            if (!silent) console.log("Processing complete...");
            resolve({ path: output, stream: outputStream });
        });

        command.on("progress", (progress) => {
            if (!silent) progressBar.update(percent(progress.percent));
        });

        command.on("error", (err: Error) => {
            if (!silent) console.log("An error occured while processing,", err.message);
            reject(new Error(err.message));
        });

        command.run();
    });

export default encoder;
