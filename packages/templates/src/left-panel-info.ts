import type { BumpGenPlugin, FabricTemplate } from "bumpgen-shared/types";
import type { FabricObject } from "fabric";

export const leftPanelInfo: FabricTemplate =
  (programmes, { convertX, convertY, getFontProperties }) =>
  async (fabric, canvas) => {
    const nextUp = programmes[0];
    const fontProperties = getFontProperties("Poppins");

    const convertPanelX = (no: number) => convertX(0.4) * no;
    const paddingPanelX = convertPanelX(0.075);
    const innerPanelWidth = convertPanelX(1) - paddingPanelX * 2;

    const panel = new fabric.Rect({
      top: 0,
      left: 0,
      width: convertPanelX(1),
      height: convertY(1),
      fill: "#008a91",
      // backgroundColor: '#008a91',
    });

    canvas.add(panel);

    const stack: { padding: number; object: FabricObject }[] = [];

    if (nextUp.iconUrl) {
      const icon = await fabric.FabricImage.fromURL(nextUp.iconUrl);
      const scaleRatio = convertPanelX(0.33) / icon.width;
      icon.scale(scaleRatio);
      // icon.width = convertPanelX(0.33);
      // icon.height = icon.height * scaleRatio;
      stack.push({ padding: 50, object: icon });
    }

    if (nextUp.start) {
      const startString = nextUp.start?.toLocaleTimeString("en-UK", {
        hour: "numeric",
        minute: "numeric",
        second: undefined,
      });
      const endString = nextUp.end?.toLocaleTimeString("en-UK", {
        hour: "numeric",
        minute: "numeric",
        second: undefined,
      });
      const timeText = new fabric.Textbox(
        endString ? `${startString} - ${endString}` : startString,
        {
          ...fontProperties,
          width: innerPanelWidth,
          fontSize: 40,
          fill: "#ffffff",
        },
      );
      stack.push({ padding: 10, object: timeText });
    }

    const titleText = new fabric.Textbox(nextUp.title, {
      ...fontProperties,
      width: innerPanelWidth,
      fontSize: 50,
      fill: "#ffffff",
    });
    stack.push({ padding: 20, object: titleText });

    const getEpisodeText = (): string | undefined => {
      if (nextUp.subtitle && nextUp.episode)
        return `${nextUp.episode} | ${nextUp.subtitle}`;
      else {
        return nextUp.subtitle ?? nextUp.episode;
      }
    };
    const episodeTextStr = getEpisodeText();

    if (episodeTextStr !== undefined) {
      const episodeText = new fabric.Textbox(episodeTextStr, {
        ...fontProperties,
        width: innerPanelWidth,
        fontSize: 30,
        fill: "#ffffff",
      });
      stack.push({ padding: 20, object: episodeText });
    }

    if (nextUp.description) {
      const descriptionText = new fabric.Textbox(nextUp.description, {
        ...fontProperties,
        width: innerPanelWidth,
        fontSize: 24,
        fill: "#ffffff",
      });
      stack.push({ padding: 0, object: descriptionText });
    }

    let rollingHeight = convertY(0.05);
    for (const { padding, object } of stack) {
      object.setY(rollingHeight);
      object.setX(paddingPanelX);
      canvas.add(object);

      rollingHeight += padding + object.getBoundingRect().height;
    }
  };

export const load: BumpGenPlugin = (registerTemplate) => {
  registerTemplate("left-panel-info", leftPanelInfo);
};
