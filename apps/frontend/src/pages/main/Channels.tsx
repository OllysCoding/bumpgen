import { Suspense } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { Typography } from "antd";

const Channels: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });

  return (
    <>
      <Typography.Title level={2}>Channels</Typography.Title>
    </>
  );
};

export const ChannelsWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Channels />
    </Suspense>
  );
};
