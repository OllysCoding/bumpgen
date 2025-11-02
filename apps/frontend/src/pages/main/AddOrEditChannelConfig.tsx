import { Suspense, useMemo } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { ChannelConfig, useSettings } from "../../hooks/useSettings";
import { useSuspenseCache } from "../../hooks/useCache";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { useParams } from "react-router";
import {
  App,
  Button,
  Flex,
  Form,
  InputNumber,
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

const channelIsInUse = (
  channelId: string,
  channels: ChannelConfig[],
): boolean => {
  return !!channels.find((channel) => channel.channelIds.includes(channelId));
};

const AddOrEditChannelConfig: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });
  const { navigateToChannels } = useAppNavigation();

  const {
    channelConfigs: allChannelConfigs,
    updateChannelConfig,
    channelConfigIsUpdating,
    createChannelConfig,
    channelConfigIsCreating,
  } = useSettings();

  const params = useParams<"id">();

  const configIndex = useMemo(() => {
    if (params.id === undefined) return undefined;
    const parsed = parseInt(params.id);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  }, [params.id]);

  const channelConfig = useMemo(
    () =>
      configIndex !== undefined ? allChannelConfigs[configIndex] : undefined,
    [configIndex, allChannelConfigs],
  );

  const channelConfigs = useMemo(() => {
    if (channelConfig) {
      return allChannelConfigs.filter((_, i) => i !== configIndex);
    }
    return allChannelConfigs;
  }, [channelConfig, allChannelConfigs, configIndex]);

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
        disabled: channelIsInUse(channel.id, channelConfigs),
      };
    });
  }, [cache.channels, channelConfigs]);

  const { message } = App.useApp();
  const [form] = Form.useForm<FieldType>();
  const useAllChannels = Form.useWatch("useAllChannels", form);
  const fitLengthToGap = Form.useWatch("fitLengthToGap", form);
  const useAllBackgroundContent = Form.useWatch(
    "useAllBackgroundContent",
    form,
  );

  const { ResetButton, isTouched } = useFormReset({ form });

  const onFinish = async (data: FieldType) => {
    try {
      if (channelConfig !== undefined) {
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
        {channelConfig ? `Edit channel config` : "Add a new channel config"}
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
            tooltip="Select the channels you would like this configuration to apply to"
            rules={[{ required: !useAllChannels }]}
            initialValue={
              channelConfig?.channelIds !== "*"
                ? channelConfig?.channelIds
                : undefined
            }
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
            initialValue={channelConfig?.channelIds === "*"}
          >
            <Switch disabled={useAllChannelsAvailable} />
          </Form.Item>
        </Flex>
        <Typography.Title level={4}>{"Output settings"}</Typography.Title>
        <Flex gap={40} align="center">
          <Form.Item<FieldType>
            style={{ width: 400 }}
            label="Length (s)"
            name="length"
            tooltip="Length in seconds of bumper content to generate"
            rules={[{ required: !fitLengthToGap }]}
            initialValue={
              channelConfig?.length !== "*" ? channelConfig?.length : undefined
            }
          >
            <InputNumber disabled={fitLengthToGap} />
          </Form.Item>
          <Typography.Paragraph>OR</Typography.Paragraph>
          <Form.Item<FieldType>
            label="Fill available gap"
            name="fitLengthToGap"
            tooltip=""
            initialValue={channelConfig?.length === "*"}
          >
            <Switch />
          </Form.Item>
        </Flex>
        <Flex gap={20} align="left">
          <Form.Item<FieldType>
            style={{}}
            label="Width"
            name="width"
            tooltip="Width in px of output video"
            rules={[{ required: true }]}
            initialValue={channelConfig?.resolution.width}
          >
            <InputNumber placeholder="1920"></InputNumber>
          </Form.Item>
          <Form.Item<FieldType>
            style={{}}
            label="Height"
            name="height"
            tooltip="Height in px of output video"
            rules={[{ required: true }]}
            initialValue={channelConfig?.resolution.height}
          >
            <InputNumber placeholder="1080"></InputNumber>
          </Form.Item>
        </Flex>
        <Form.Item<FieldType>
          style={{ width: 400 }}
          label="Template"
          name="template"
          tooltip="The template to use when generating bumper for these channel(s)"
          rules={[{ required: true }]}
          initialValue={channelConfig?.template}
        >
          <Select
            placeholder="Select a option and change input text above"
            allowClear
          >
            {cache.templates.map((template) => (
              <Select.Option value={template.name}>
                {template.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Flex gap={40} align="center">
          <Form.Item<FieldType>
            style={{ width: 400 }}
            label="Background Content"
            name="backgroundContent"
            tooltip="Select the background content you would like to use. If choosing multiple, it will be chosen at random."
            rules={[{ required: !useAllBackgroundContent }]}
            initialValue={
              channelConfig?.backgroundContent !== "*"
                ? channelConfig?.backgroundContent
                : undefined
            }
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Select background content"
              disabled={useAllBackgroundContent}
            >
              {cache.backgroundContent.map((backgroundContent) => (
                <Select.Option value={backgroundContent.relativePath}>
                  {backgroundContent.relativePath}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Typography.Paragraph>OR</Typography.Paragraph>
          <Form.Item<FieldType>
            label="Use all background content?"
            name="useAllBackgroundContent"
            initialValue={channelConfig?.backgroundContent === "*"}
          >
            <Switch />
          </Form.Item>
        </Flex>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!isTouched}
              loading={channelConfigIsCreating || channelConfigIsUpdating}
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
