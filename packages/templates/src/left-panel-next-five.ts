import type { BumpGenPlugin, FabricTemplate } from "bumpgen-shared/types";
import type { FabricObject } from "fabric/node";

export const leftPanelNextFive: FabricTemplate =
  (programmes, { convertX, convertY, getFontProperties }) =>
  async (fabric, canvas) => {
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
    });

    canvas.add(panel);

    const stack: { padding: number; object: FabricObject }[] = [];

    stack.push({
      object: new fabric.FabricText("Next up", {
        ...getFontProperties("Poppins", "bold"),
        width: innerPanelWidth,
        fontSize: 50,
        fill: "#ffffff",
      }),
      padding: 30,
    });

    for (const programme of programmes.slice(
      0,
      Math.min(programmes.length, 5),
    )) {
      if (programme.start) {
        const startString = programme.start?.toLocaleTimeString("en-UK", {
          hour: "numeric",
          minute: "numeric",
          second: undefined,
        });
        const endString = programme.end?.toLocaleTimeString("en-UK", {
          hour: "numeric",
          minute: "numeric",
          second: undefined,
        });
        const timeText = new fabric.Textbox(
          endString ? `${startString} - ${endString}` : startString,
          {
            ...getFontProperties("Poppins", "light"),
            width: innerPanelWidth,
            fontSize: 30,
            fill: "#ffffff",
          },
        );
        stack.push({ padding: 0, object: timeText });
      }

      const titleText = new fabric.Textbox(programme.title, {
        ...fontProperties,
        width: innerPanelWidth,
        fontSize: 40,
        fill: "#ffffff",
      });
      stack.push({ padding: 4, object: titleText });

      const getEpisodeText = (): string | undefined => {
        if (programme.subtitle && programme.episode)
          return `${programme.episode} | ${programme.subtitle}`;
        else {
          return programme.subtitle ?? programme.episode;
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
        stack.push({ padding: 28, object: episodeText });
      }
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
  registerTemplate("left-panel-next-five", leftPanelNextFive);
};
