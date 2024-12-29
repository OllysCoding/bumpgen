import type { FabricTemplate } from "./index.js";

export const centreTitleAndTime: FabricTemplate = (overlay, convertX, convertY) => 
  (fabric, canvas) => {

    const textGroupObjects: fabric.Object[] = [];

    if (overlay.start) {
      const startString = overlay.start?.toLocaleTimeString('en-UK', {
        hour: 'numeric',
        minute: 'numeric',
        second: undefined,
      })
  
      const time = startString ? new fabric.Text(startString, {
        originX: 'center',
        fontSize: 80,
        fill: "#ffffff",
      }) : undefined;
  
      if (time) textGroupObjects.push(time);
    }

    const timeBounding = textGroupObjects[0]?.getBoundingRect();
    const titleText = overlay.episode ? `${overlay.title} | ${overlay.episode}` : overlay.title
    const title = new fabric.Text(titleText, {
      originX: 'center',
      top: timeBounding && (timeBounding.height + 20),
      fontSize: 92,
      fill: "#ffffff",
    });

    textGroupObjects.push(title);

    if (overlay.start) {
      const titleBounding = title.getBoundingRect();
      const line = new fabric.Rect({
        left: titleBounding.left,
        top: titleBounding.top - 10,
        width: titleBounding.width,
        height: 2,
        fill: '#ffffff'
      })
      textGroupObjects.push(line)
    }

    const textGroup = new fabric.Group(textGroupObjects, {
      originX: 'center',
      originY: 'center',
      top: convertY(0.5),
      left: convertX(0.5),
    });

    const textGroupBounding = textGroup.getBoundingRect();

    const overlayBackground = new fabric.Rect({
      left: textGroupBounding.left - 20,
      top: textGroupBounding.top - 20,
      width: textGroupBounding.width + 40,
      height: textGroupBounding.height + 40,
      opacity: 0.80,
      fill: '#000000'
    })

    canvas.add(overlayBackground);
    canvas.add(textGroup);
}