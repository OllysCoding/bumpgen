import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { MainPage } from "./MainPage";
import { DashboardWithSuspense } from "./main/Dashboard";
import { SettingsWithSuspense } from "./main/Settings";
import { App as AntdApp } from "antd";
import { SetupPage } from "./SetupPage";
import { SetupWithSuspense } from "./setup/Setup";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChannelsWithSuspense } from "./main/Channels";
import { BackgroundContentWithSuspense } from "./main/BackgroundContent";
import { AddOrEditBackgroundContentWithSuspense } from "./main/AddOrEditBackgroundContent";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <BrowserRouter>
            <Routes>
              <Route element={<SetupPage />} path="setup">
                <Route index element={<SetupWithSuspense />}></Route>
              </Route>
              <Route element={<MainPage />}>
                <Route index element={<DashboardWithSuspense />}></Route>
                <Route
                  path="settings"
                  element={<SettingsWithSuspense />}
                ></Route>
                <Route
                  path="channels"
                  element={<ChannelsWithSuspense />}
                ></Route>
                <Route
                  path="background-content"
                  element={<BackgroundContentWithSuspense />}
                ></Route>
                <Route
                  path="background-content/add"
                  element={<AddOrEditBackgroundContentWithSuspense />}
                ></Route>
                <Route
                  path="background-content/edit/:filepath"
                  element={<AddOrEditBackgroundContentWithSuspense />}
                ></Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AntdApp>
      </QueryClientProvider>
    </>
  );
};
