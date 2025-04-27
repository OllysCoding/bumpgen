import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { useSettings } from "../../hooks/useSettings";
import { useSuspenseCache } from "../../hooks/useCache";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { useParams } from "react-router";
import {
  App,
  Button,
  Flex,
  Form,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useFormReset } from "../../hooks/useFormReset";

type FieldType = {
  useAllChannels: boolean;
  channelIds?: string[];
  useAllBackgroundContent: boolean;
  backgroundContent?: string[];
  template: string;
  fitLengthToGap: boolean;
  length?: number;
  width: number;
  height: number;
};

const AddOrEditChannelConfig: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });
  const { navigateToChannels } = useAppNavigation();

  const {
    channelConfigs,
    updateChannelConfig,
    channelConfigIsUpdating,
    createChannelConfig,
    channelConfigIsCreating,
  } = useSettings();

  const useAllChannelsAvailable = useMemo(() => {
    return (
      channelConfigs.findIndex(
        (channelConfig) => channelConfig.channelIds === "*",
      ) !== -1
    );
  }, [channelConfigs]);

  const cache = useSuspenseCache();

  const channelOptions = useMemo(() => {
    return cache.channels.map((channel) => {
      return {
        label: `${channel.name} - ${channel.id}`,
        value: channel.id,
      };
    });
  }, [cache.channels]);

  const { message } = App.useApp();
  const [form] = Form.useForm<FieldType>();
  const useAllChannels = Form.useWatch("useAllChannels", form);

  const { ResetButton, isTouched } = useFormReset({ form });

  const { index: configIndex } = useParams<"index">();

  const onFinish = async (data: FieldType) => {
    try {
      if (configIndex !== undefined) {
        // Update
        await updateChannelConfig({
          index: Number(configIndex),
          channelConfig: {
            channelIds: data.useAllChannels ? "*" : data.channelIds!,
            backgroundContent: data.useAllBackgroundContent
              ? "*"
              : data.backgroundContent!,
            length: data.fitLengthToGap ? "*" : data.length!,
            template: data.template,
            resolution: { width: data.width, height: data.height },
          },
        });
        message.success(`Updated config for ${data.length} channels!`);
        navigateToChannels();
      } else {
        // Creating
        await createChannelConfig({
          channelIds: data.useAllChannels ? "*" : data.channelIds!,
          backgroundContent: data.useAllBackgroundContent
            ? "*"
            : data.backgroundContent!,
          length: data.fitLengthToGap ? "*" : data.length!,
          template: data.template,
          resolution: { width: data.width, height: data.height },
        });
        message.success(`Updated config for ${data.length} channels!`);
        navigateToChannels();
      }
    } catch (err) {
      console.error(err);
      message.error("Something went wrong saving your channel config");
    }
  };

  return (
    <>
      <Typography.Title level={2}>
        {configIndex ? `Edit channel config` : "Add a new channel config"}
      </Typography.Title>
      <Form<FieldType>
        layout="vertical"
        form={form}
        onFinish={onFinish}
        disabled={channelConfigIsCreating || channelConfigIsUpdating}
      >
        <Flex gap={40} align="center">
          <Form.Item<FieldType>
            style={{ width: 400 }}
            label="Channels"
            name="channelIds"
            tooltip="Helo"
            rules={[{ required: true }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Select Channels"
              options={channelOptions}
              disabled={useAllChannels}
            />
          </Form.Item>
          <Typography.Paragraph>OR</Typography.Paragraph>
          <Form.Item<FieldType>
            label="Use all channels?"
            name="useAllChannels"
            rules={[{ required: true }]}
          >
            <Switch disabled={useAllChannelsAvailable} />
          </Form.Item>
        </Flex>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!isTouched}
              loading={
                false
                // backgroundContentIsCreating || backgroundContentIsUpdating
              }
            >
              Save
            </Button>
            <ResetButton />
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export const AddOrEditChannelConfigWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <AddOrEditChannelConfig />
    </Suspense>
  );
};
