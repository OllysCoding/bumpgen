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
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { useSettings } from "../../hooks/useSettings";

interface ChannelConfigTable {
  channelIds: ["*"] | string[];
  template: string;
  backgroundContent: ["*"] | string[];
  resolution: string;
}

const ChannelButtons: React.FC<{
  content: ChannelConfigTable;
  index: number;
}> = ({ content, index }) => {
  const { modal, message } = App.useApp();
  const { deleteChannelConfig } = useSettings();

  const { navigateToEditChannelConfig } = useAppNavigation();

  const deleteItem = (index: number, channelIds: ["*"] | string[]) => {
    modal.confirm({
      title: `Delete config for ${channelIds[0] === "*" ? "All channels" : channelIds.join(" & ")}?`,
      icon: <ExclamationCircleFilled />,
      onOk: async () => {
        try {
          await deleteChannelConfig(index);
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
        onClick={() => navigateToEditChannelConfig(index)}
      >
        Edit
      </Button>
      <Button
        icon={<DeleteOutlined />}
        danger
        onClick={() => deleteItem(index, content.channelIds)}
      ></Button>
    </Space>
  );
};

const columns: TableProps<ChannelConfigTable>["columns"] = [
  {
    title: "Channels",
    dataIndex: "channelIds",
    key: "channels",
    render: (_, record) => (
      <>
        {record.channelIds.map((id) => (
          <Tag>{id}</Tag>
        ))}
      </>
    ),
  },
  {
    title: "Template",
    dataIndex: "template",
    key: "template",
  },
  {
    title: "Background Content",
    dataIndex: "backgroundContent",
    key: "backgroundContent",
    render: (_, record) => (
      <>
        {record.backgroundContent.map((b) => (
          <Tag>{b}</Tag>
        ))}
      </>
    ),
  },
  {
    title: "Resolution",
    dataIndex: "resolution",
    key: "resolution",
  },
  {
    key: "action",
    width: 100,
    render: (_, record, index) => (
      <ChannelButtons content={record} index={index} />
    ),
  },
];

const Channels: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });
  const { channelConfigs } = useSettings();

  const { navigateToAddChannelConfig } = useAppNavigation();

  const channelConfigItems = useMemo(
    () =>
      channelConfigs.map((c) => {
        return {
          ...c,
          channelIds: c.channelIds === "*" ? ["*"] : c.channelIds,
          backgroundContent:
            c.backgroundContent === "*" ? ["*"] : c.backgroundContent,
          resolution: `${c.resolution.width}x${c.resolution.height}`,
        };
      }),
    [channelConfigs],
  );

  return (
    <>
      <Typography.Title level={2}>Channel Configuration</Typography.Title>
      <Typography.Paragraph>
        Configure one or multiple channels to use a certain template, the length
        & resolution of the bumper content & which background content it should
        use.
      </Typography.Paragraph>
      <Table<ChannelConfigTable>
        columns={columns}
        dataSource={channelConfigItems}
        pagination={{
          position: ["topRight"],
        }}
      ></Table>
      <Space style={{ marginTop: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          iconPosition={"start"}
          onClick={() => navigateToAddChannelConfig()}
        >
          Add new
        </Button>
      </Space>
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
