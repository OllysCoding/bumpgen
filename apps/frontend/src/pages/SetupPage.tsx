import { Layout, theme } from "antd";
import React from "react";
import { BumpgenHeader } from "../components/Header";
import { Outlet } from "react-router";
import { SuspenseErrorBoundary } from "../components/ErrorBoundary";
import { BumpgenFooter } from "../components/Footer";

export const SetupPage: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <BumpgenHeader />
      <Layout style={{ padding: "24px 24px" }}>
        <Layout.Content
          style={{
            padding: 24,
            margin: 0,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SuspenseErrorBoundary>
            <Outlet />
          </SuspenseErrorBoundary>
        </Layout.Content>
        <BumpgenFooter />
      </Layout>
    </Layout>
  );
};
