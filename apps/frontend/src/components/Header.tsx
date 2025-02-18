import { GithubOutlined } from "@ant-design/icons";

import { Layout, Typography } from "antd";

export const BumpgenHeader: React.FC = () => (
  <Layout.Header
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Typography.Title style={{ color: "#ffffff", marginBottom: 4 }}>
      Bumpgen
    </Typography.Title>
    <a
      href={"https://github.com/ollyscoding/bumpgen"}
      style={{ lineHeight: 2 }}
    >
      <GithubOutlined style={{ fontSize: "30px" }} />
    </a>
  </Layout.Header>
);
