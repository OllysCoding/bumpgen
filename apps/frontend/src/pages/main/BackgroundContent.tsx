import { Suspense, useMemo } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { App, Button, Space, Table, TableProps, Tag, Typography } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
} from "@ant-design/icons";
import { useSettings } from "../../hooks/useSettings";
import { useNavigate } from "react-router";

interface BackgroundContentTable {
  filepath: string;
  windows: [number, number][];
}

const BackgroundContentButtons: React.FC<{
  content: BackgroundContentTable;
}> = ({ content }) => {
  const navigate = useNavigate();

  const { modal, message } = App.useApp();
  const { deleteBackgroundContentConfig } = useSettings();

  const deleteItem = (filePath: string) => {
    modal.confirm({
      title: `Delete config for "${filePath}"?`,
      icon: <ExclamationCircleFilled />,
      onOk: async () => {
        try {
          await deleteBackgroundContentConfig({ filePath });
        } catch (err) {
          console.error(err);
          message.error("Something went wrong when deleting");
        }
      },
    });
  };

  return (
    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
      <Button
        icon={<EditOutlined />}
        color={"blue"}
        onClick={() => navigate(`/background-content/edit/${content.filepath}`)}
      >
        Edit
      </Button>
      <Button
        icon={<DeleteOutlined />}
        danger
        onClick={() => deleteItem(content.filepath)}
      ></Button>
    </Space>
  );
};

const columns: TableProps<BackgroundContentTable>["columns"] = [
  {
    title: "File",
    dataIndex: "filepath",
    key: "filepath",
  },
  {
    title: "Windows",
    dataIndex: "windows",
    key: "windows",
    render: (_, record) => (
      <>
        {record.windows.map(([start, end]) => (
          <Tag>
            {start}s - {end}s
          </Tag>
        ))}
      </>
    ),
  },
  {
    key: "action",
    width: 100,
    render: (_, record) => <BackgroundContentButtons content={record} />,
  },
];

const BackgroundContent: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });
  const { backgroundContentConfigs } = useSettings();

  const navigate = useNavigate();

  const backgroundContentItems = useMemo(
    () =>
      Object.entries(backgroundContentConfigs).map(([filepath, data]) => ({
        filepath,
        ...data,
      })),
    [backgroundContentConfigs],
  );

  return (
    <>
      <Typography.Title level={2}>
        Background content configuration
      </Typography.Title>
      <Typography.Paragraph>
        If you have background content which you only want to use a section or
        sections of for your bumper content, you can configure that here. All
        background content within the folder can be used in your channel
        configs, a config here is not needed.
      </Typography.Paragraph>
      <Table<BackgroundContentTable>
        columns={columns}
        dataSource={backgroundContentItems}
        pagination={{
          position: ["topRight"],
        }}
      ></Table>
      <Space style={{ marginTop: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          iconPosition={"start"}
          onClick={() => navigate("/background-content/add")}
        >
          Add new
        </Button>
      </Space>
    </>
  );
};

export const BackgroundContentWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <BackgroundContent />
    </Suspense>
  );
};
