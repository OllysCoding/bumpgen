import ffmpeg from "fluent-ffmpeg";
import { fabric } from "fabric";
import { TimelineMax } from "gsap";
import { Readable } from "stream";
import * as cliProgress from "cli-progress";

import ffmpegPath from "ffmpeg-static";
import * as ffprobe from "ffprobe-static";
import { type Renderer } from "./types.js";
import { logError } from "../logger/index.js";
import { gsap } from "gsap";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

const typeCheck = (reject: (reason?: any) => void, config: any) => {
    const { width, height, fps, makeScene } = config;
    if (!(typeof width === "number")) {
        reject(new Error(`width should be a number. You provided ${typeof width}`));
    }
    if (!(typeof height === "number")) {
        reject(new Error(`height should be a number. You provided ${typeof height}`));
    }
    if (!(typeof fps === "number")) {
        reject(new Error(`fps should be a number. You provided ${typeof fps}`));
    }
    if (!(typeof makeScene === "function")) {
        reject(new Error(`makeScene should be a function. You provided ${typeof makeScene}`));
    }
};

const progressBar = new cliProgress.SingleBar({
    format: `Rendering | {bar} | {percentage}%`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
});

const renderer: Renderer = (config) =>
    new Promise((resolve, reject) => {
        try {
            const { width, height, fps, makeScene, silent = true } = config;
            const canvas = new fabric.StaticCanvas(null, { width, height });
            const anim = gsap.timeline({ paused: true });
            const stream = new Readable();

            typeCheck(reject, config);

            let totalFrames: number;
            let currentFrame = 0;
            gsap.ticker.fps(fps);

            const renderFrames = () => {
                anim.progress(currentFrame++ / totalFrames);
                if (currentFrame <= totalFrames) {
                    if (!silent) progressBar.update(currentFrame);

                    canvas.renderAll();
                    const buffer = Buffer.from(
                        canvas.toDataURL().replace(/^data:\w+\/\w+;base64,/, ""),
                        "base64",
                    );
                    stream.push(buffer);
                    renderFrames();
                } else {
                    if (!silent) console.log("\nRendering complete...");
                    if (!silent) progressBar.stop();
                    stream.push(null);
                    resolve(stream);
                }
            };

            makeScene(fabric, canvas, anim, () => {
                const duration = anim.duration();
                totalFrames = Math.max(1, Math.ceil((duration / 1) * fps));

                if (!silent) progressBar.start(totalFrames, 0);
                renderFrames();
            });
        } catch (e) {
            logError('An error occured in the renderer', e);
            reject(new Error("An error occured in the renderer."));
        }
    });

export default renderer;
