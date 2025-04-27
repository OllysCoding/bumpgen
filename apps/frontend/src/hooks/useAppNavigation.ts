import { useCallback } from "react";
import { useNavigate } from "react-router";
import { paths } from "../utils/constants";

export const useAppNavigation = () => {
  const navigate = useNavigate();

  const navigateToHome = useCallback(() => navigate(paths.home), [navigate]);
  const navigateToSettings = useCallback(
    () => navigate(paths.settings),
    [navigate],
  );
  const navigateToChannels = useCallback(
    () => navigate(paths.channels.list),
    [navigate],
  );
  const navigateToAddChannelConfig = useCallback(
    () => navigate(paths.channels.add),
    [navigate],
  );
  const navigateToEditChannelConfig = useCallback(
    (index: number) =>
      navigate(paths.channels.edit.replace("*", index.toString())),
    [navigate],
  );
  const navigateToBackgroundContent = useCallback(
    () => navigate(paths.backgroundContent.list),
    [navigate],
  );
  const navigateToAddBackgroundContent = useCallback(
    () => navigate(paths.backgroundContent.add),
    [navigate],
  );
  const navigateToEditBackgroundContent = useCallback(
    (item: string) => navigate(paths.backgroundContent.edit.replace("*", item)),
    [navigate],
  );

  return {
    navigateToHome,
    navigateToSettings,
    navigateToChannels,
    navigateToAddChannelConfig,
    navigateToEditChannelConfig,
    navigateToBackgroundContent,
    navigateToAddBackgroundContent,
    navigateToEditBackgroundContent,
  };
};
