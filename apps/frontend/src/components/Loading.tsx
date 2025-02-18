import { Spin } from "antd";
import React from "react";

export const Loading: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
      }}
    >
      <Spin size="large" />
    </div>
  );
};
