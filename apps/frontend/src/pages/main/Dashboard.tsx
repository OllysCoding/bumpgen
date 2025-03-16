import { ComponentProps, Suspense, useMemo } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { useSuspenseCache } from "../../hooks/useCache";
import {
  Col,
  Divider,
  List,
  Progress,
  Row,
  StepProps,
  Steps,
  Tag,
  Typography,
} from "antd";
import { ChannelResult, useLiveStats } from "../../hooks/useLiveStats";
import {
  CheckOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";

const getChannelStatus = (
  channelResult: ChannelResult | undefined,
  inProgress: boolean,
): StepProps["status"] => {
  if (inProgress) return "process";
  if (!channelResult) {
    return "wait";
  }

  switch (channelResult.result) {
    case "error":
      return "error";
    case "not-configured":
    case "generated":
    case "up-to-date":
      return "finish";
  }
};

const getChannelIcon = (
  channelResult: ChannelResult | undefined,
  inProgress: boolean,
): StepProps["icon"] => {
  if (inProgress) return <LoadingOutlined />;

  switch (channelResult?.result) {
    case "error":
      return <ExclamationCircleOutlined />;
    case "not-configured":
      return <MinusCircleOutlined />;
    case "generated":
    case "up-to-date":
      return <CheckOutlined />;
  }
};

const getChannelResultString = (
  channelResult: ChannelResult | undefined,
  inProgress: boolean,
): string | undefined => {
  if (inProgress) return undefined;

  switch (channelResult?.result) {
    case "error":
      return "An error occurred";
    case "not-configured":
      return "Not configured for bumper content";
    case "generated":
      return "Generated bumper";
    case "up-to-date":
      return "Bumper up to date";
  }
};

const Dashboard: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });

  const cache = useSuspenseCache();

  const { stats, latestStatus } = useLiveStats();

  const progressProps = useMemo((): Partial<
    ComponentProps<typeof Progress>
  > => {
    if (!latestStatus)
      return {
        percent: 0,
        strokeColor: "grey",
        format: () => "Unknown",
      };
    if (latestStatus.status === "waiting") {
      const nextRun = new Date(latestStatus.data.nextRun);
      const nextRunString = nextRun.toLocaleTimeString();

      return {
        percent: 0,
        strokeColor: "grey",
        format: () => (
          <>
            {/* <Typography.Title level={4}>Waiting</Typography.Title> */}
            <Typography.Text>Next Run {nextRunString}</Typography.Text>
          </>
        ),
      };
    }
    if (latestStatus.status === "starting")
      return {
        percent: 1,
        strokeColor: "yellow",
        format: () => "Starting",
      };

    if (latestStatus.status === "running")
      return {
        percent:
          (latestStatus.data.channelIndex + 1 / latestStatus.data.numChannels) *
          100,
        strokeColor: "green",
        format: () =>
          `${latestStatus.data.task} ${latestStatus.data.channelId}`,
      };

    return {};
  }, [latestStatus]);

  const steps = useMemo((): StepProps[] => {
    const steps =
      stats?.lastRun.channelIds.map((channelId) => {
        const channelResult = stats.lastRun.channelResults[channelId];

        const isInProgress =
          latestStatus?.status === "running" &&
          latestStatus.data.channelId === channelId;

        return {
          title: channelId,
          subTitle:
            channelResult?.duration !== undefined
              ? `${channelResult?.duration}ms`
              : undefined,
          description: getChannelResultString(channelResult, isInProgress),
          status: getChannelStatus(channelResult, isInProgress),
          icon: getChannelIcon(channelResult, isInProgress),
        };
      }) ?? [];

    return steps;
  }, [stats, latestStatus]);

  return (
    <>
      <Typography.Title level={2}>Dashboard</Typography.Title>
      <Row gutter={24}>
        <Col xs={24} xl={8}>
          <Divider orientation="left">Run info</Divider>
          <Steps
            // progressDot
            // current={1}
            // size="small"
            items={[...steps]}
            direction="vertical"
          />
        </Col>
        <Col xs={24} xl={16}>
          <Row gutter={24}>
            <Col xs={24} xl={6}>
              <Divider orientation="left">Live Status</Divider>
              <Progress type="circle" size={150} {...progressProps} />
            </Col>
            <Col xs={24} xl={18}>
              <Divider orientation="left">Channels</Divider>
              <List
                // style={{ height: "100%" }}
                pagination={{ position: "bottom", align: "end", pageSize: 10 }}
                size="small"
                bordered
                dataSource={cache.channels}
                renderItem={(item) => (
                  <List.Item>
                    <Typography.Text>{item.name}</Typography.Text>
                    <Tag>{item.id}</Tag>
                  </List.Item>
                )}
              />
            </Col>
            <Col xs={24} xl={12}>
              <Divider orientation="left">Background Content</Divider>
              <List
                // style={{ height: "100%" }}
                pagination={{ position: "bottom", align: "end", pageSize: 10 }}
                size="small"
                bordered
                dataSource={cache.backgroundContent}
                renderItem={(item) => {
                  const date = new Date((item.length ?? 0) * 1000);
                  const length = date.toLocaleTimeString();

                  return (
                    <List.Item>
                      <Typography.Text>{item.relativePath}</Typography.Text>
                      <Tag>{length}s</Tag>
                    </List.Item>
                  );
                }}
              />
            </Col>

            <Col xs={24} xl={12}>
              <Divider orientation="left">Templates</Divider>
              <List
                // style={{ height: "100%" }}
                pagination={{ position: "bottom", align: "end", pageSize: 10 }}
                size="small"
                bordered
                dataSource={cache.templates}
                renderItem={(item) => (
                  <List.Item>
                    <Typography.Text code>{item.name}</Typography.Text>
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export const DashboardWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
};
