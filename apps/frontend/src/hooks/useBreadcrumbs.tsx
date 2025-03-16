import { Link, useLocation } from "react-router";
import { paths } from "../utils/constants";
import { useMemo } from "react";
import { Breadcrumb } from "antd";

const homePart = {
  title: "Home",
  href: paths.home,
};
const settingsPart = {
  title: "Settings",
  href: paths.settings,
};
const channelsPart = {
  title: "Channels",
  href: paths.channels.list,
};
const backgroundContentPart = {
  title: "Background Content",
  href: paths.backgroundContent.list,
};

const breadcrumbPaths = [
  {
    path: paths.home,
    parts: [homePart],
  },
  {
    path: paths.settings,
    parts: [homePart, settingsPart],
  },
  {
    path: paths.channels.list,
    parts: [homePart, channelsPart],
  },
  {
    path: paths.channels.add,
    parts: [homePart, channelsPart, { title: "Add", href: paths.channels.add }],
  },
  {
    path: paths.channels.edit,
    parts: [
      homePart,
      channelsPart,
      { title: "Edit", href: paths.channels.edit },
    ],
  },
  {
    path: paths.backgroundContent.list,
    parts: [homePart, backgroundContentPart],
  },
  {
    path: paths.backgroundContent.add,
    parts: [
      homePart,
      backgroundContentPart,
      { title: "Add", href: paths.backgroundContent.add },
    ],
  },
  {
    path: paths.backgroundContent.edit,
    parts: [
      homePart,
      backgroundContentPart,
      { title: "Edit", href: paths.backgroundContent.edit },
    ],
  },
];

export const useBreadcrumbs = () => {
  const location = useLocation();

  const parts = useMemo(() => {
    return (
      breadcrumbPaths.find((p) => {
        if (p.path.endsWith("*")) {
          return location.pathname.startsWith(
            p.path.slice(0, p.path.length - 1),
          );
        } else {
          return p.path === location.pathname;
        }
      })?.parts ?? [homePart]
    );
  }, [location.pathname]);

  return (
    <Breadcrumb
      style={{ paddingBottom: 24 }}
      itemRender={(currentRoute, _params, items) => {
        const isLast = currentRoute?.href === items[items.length - 1]?.href;

        return isLast ? (
          <span>{currentRoute.title}</span>
        ) : (
          <Link to={`${currentRoute.href}`}>{currentRoute.title}</Link>
        );
      }}
      items={parts}
    />
  );
};
