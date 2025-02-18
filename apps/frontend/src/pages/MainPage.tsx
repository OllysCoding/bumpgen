import { Layout, Menu, theme, type MenuProps } from "antd";
import {
  SettingOutlined,
  FolderOpenOutlined,
  OrderedListOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import type React from "react";
import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { BumpgenHeader } from "../components/Header";
import { SuspenseErrorBoundary } from "../components/ErrorBoundary";
import { BumpgenFooter } from "../components/Footer";

type MenuItem = Required<MenuProps>["items"][number];

export const MainPage: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        onClick: () => navigate("/", { viewTransition: true }),
      },
      {
        key: "channels",
        label: "Channels",
        icon: <OrderedListOutlined />,
        onClick: () => navigate("/channels", { viewTransition: true }),
      },
      {
        key: "background-content",
        label: "Background content",
        icon: <FolderOpenOutlined />,
        onClick: () =>
          navigate("/background-content", { viewTransition: true }),
      },
      {
        key: "settings",
        label: "Settings",
        icon: <SettingOutlined />,
        onClick: () => navigate("/settings", { viewTransition: true }),
      },
    ];
    return items;
  }, []);

  const activeItem = useMemo(() => {
    const searchKey =
      location.pathname === "/" ? "dashboard" : location.pathname.slice(1);
    return menuItems.find((item) => searchKey === item?.key)?.key as string;
  }, [location.pathname, menuItems]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <BumpgenHeader />
      <Layout>
        <Layout.Sider width={300} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[activeItem]}
            style={{ height: "100%", borderRight: 0 }}
            items={menuItems}
          />
        </Layout.Sider>
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
    </Layout>
  );
};
