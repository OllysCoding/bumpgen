import type { BumpGenPlugin, FabricTemplate } from "bumpgen-shared/types";
import type { FabricObject } from "fabric";

export const centreTitleAndTime: FabricTemplate =
  (programmes, { convertX, convertY, getFontProperties }) =>
  async (fabric, canvas) => {
    const nextUp = programmes[0];

    const textGroupObjects: FabricObject[] = [];
    const fontProperties = getFontProperties("Poppins");

    if (nextUp.start) {
      const startString = nextUp.start?.toLocaleTimeString("en-UK", {
        hour: "numeric",
        minute: "numeric",
        second: undefined,
      });

      const time = startString
        ? new fabric.FabricText(startString, {
            ...fontProperties,
            originX: "center",
            fontSize: 80,
            fill: "#ffffff",
          })
        : undefined;

      if (time) textGroupObjects.push(time);
    }

    const timeBounding = textGroupObjects[0]?.getBoundingRect();
<<<<<<< HEAD
    const titleText = nextUp.episode
      ? `${nextUp.title} | ${nextUp.episode}`
      : nextUp.title;
=======
    const titleText = overlay.episode
      ? `${overlay.title} | ${overlay.episode}`
      : overlay.title;
>>>>>>> c36272b21a10621f144d71ff45c557d003e681ec
    const title = new fabric.FabricText(titleText, {
      ...fontProperties,
      originX: "center",
      top: timeBounding && timeBounding.height + 20,
      fontSize: 92,
      fill: "#ffffff",
    });

    if (title.getBoundingRect().width > convertX(0.9)) {
      title.scale(Math.max(convertX(0.9) / title.getBoundingRect().width, 0.5));
    }

    textGroupObjects.push(title);

    if (nextUp.start) {
      const titleBounding = title.getBoundingRect();
      const line = new fabric.Rect({
        left: titleBounding.left,
        top: titleBounding.top - 10,
        width: titleBounding.width,
        height: 2,
        fill: "#ffffff",
      });
      textGroupObjects.push(line);
    }

    const textGroup = new fabric.Group(textGroupObjects, {
      originX: "center",
      originY: "center",
      top: convertY(0.5),
      left: convertX(0.5),
    });

    const textGroupBounding = textGroup.getBoundingRect();

    const overlayBackground = new fabric.Rect({
      left: textGroupBounding.left - 20,
      top: textGroupBounding.top - 20,
      width: textGroupBounding.width + 40,
      height: textGroupBounding.height + 40,
      opacity: 0.8,
      fill: "#000000",
    });

    canvas.add(overlayBackground);
    canvas.add(textGroup);
  };

export const load: BumpGenPlugin = (registerTemplate) => {
  registerTemplate("centre-title-and-time", centreTitleAndTime);
};
