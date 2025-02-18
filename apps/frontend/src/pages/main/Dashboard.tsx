import { Suspense } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { useSuspenseCache } from "../../hooks/useCache";
import { Col, Divider, List, Row, Tag, Typography } from "antd";

const Dashboard: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });

  const cache = useSuspenseCache();

  return (
    <>
      <Typography.Title level={2}>Dashboard</Typography.Title>
      {/* <DebugCache></DebugCache> */}
      <Row gutter={24}>
        <Col xs={24} xl={8}>
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

        <Col xs={24} xl={8}>
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

        <Col xs={24} xl={8}>
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
