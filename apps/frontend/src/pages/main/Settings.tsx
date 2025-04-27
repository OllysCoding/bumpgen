import { Suspense, useEffect, useState } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { type Settings, useSettings } from "../../hooks/useSettings";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { DOCKER_DEFAULTS } from "../setup/defaults";

const Settings: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });
  const { settings, updateSettings, settingsIsUpdating } = useSettings();

  const { message } = App.useApp();
  const [form] = Form.useForm<Settings>();
  const [isFormTouched, setIsFormTouched] = useState(false);

  useEffect(() => {
    form.resetFields();
  }, [settings]);

  Form.useWatch(() => {
    setIsFormTouched(form.isFieldsTouched());
  }, form);

  const onReset = () => {
    form.resetFields();
  };

  const onFinish = async (data: Settings) => {
    try {
      await updateSettings(data);
      message.success("Settings saved!");
    } catch (err) {
      console.error(err);
      message.error("Something went wrong saving your settings");
    }
  };

  return (
    <>
      <Typography.Title level={2}>Settings</Typography.Title>
      <Form
        form={form}
        name="setup"
        layout="vertical"
        requiredMark="optional"
        onFinish={onFinish}
        style={{ maxWidth: 400, width: 400 }}
        disabled={settingsIsUpdating}
      >
        <Form.Item<Settings>
          label="XML TV Url"
          name="xmlTvUrl"
          tooltip="URL to your XMLTV file, used to fetch info on your channels & programmes. Most likely ends in .xml"
          rules={[
            { required: true, message: "Please provide XMLTV URL" },
            { type: "url" },
          ]}
          initialValue={settings.xmlTvUrl}
        >
          <Input placeholder="e.g 'https://your.iptv.server/xmltv.xml'" />
        </Form.Item>
        <Form.Item<Settings>
          label="Language"
          name="language"
          tooltip="The language to use for pulling programme information from your XMLTV file. Should match 'lang' attributes in your XMLTV file"
          rules={[{ required: true }]}
          initialValue={settings.language}
        >
          <Input placeholder="e.g 'en'" />
        </Form.Item>
        <Form.Item<Settings>
          label="Interval"
          name="interval"
          tooltip="Time in minutes between checking the current output & re-generating background content if needed"
          rules={[{ required: true }, { type: "number", min: 1, max: 60 }]}
          initialValue={settings.interval}
        >
          <InputNumber placeholder="e.g '5'" />
        </Form.Item>
        <Form.Item<Settings>
          label="Output Folder"
          name="outputFolder"
          tooltip="Folder path to output bumper content to"
          rules={[{ required: true }]}
          initialValue={settings.outputFolder}
        >
          <Input placeholder={`e.g '${DOCKER_DEFAULTS.outputFolder}'`} />
        </Form.Item>
        <Form.Item<Settings>
          label="Background Content Folder"
          name="backgroundContentFolder"
          tooltip="Folder path that contains background content video files which will play behind the overlay in your bumper content"
          rules={[{ required: true }]}
          initialValue={settings.backgroundContentFolder}
        >
          <Input
            placeholder={`e.g '${DOCKER_DEFAULTS.backgroundContentFolder}'`}
          />
        </Form.Item>
        <Form.Item<Settings>
          label="Log level"
          name="logLevel"
          rules={[{ required: true }]}
          initialValue={settings.logLevel}
        >
          <Select>
            <Select.Option value="DEBUG">Debug</Select.Option>
            <Select.Option value="INFO">Info</Select.Option>
            <Select.Option value="ERROR">Error</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item<Settings>
          label="Experimental plugin support"
          name="experimentalPluginsSupport"
          tooltip="Enables experimental support for plugins, which can you can learn more about in the docs"
          valuePropName="checked"
          rules={[{ required: true }]}
          initialValue={settings.experimentalPluginsSupport}
        >
          <Switch />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!isFormTouched}
              loading={settingsIsUpdating}
            >
              Save
            </Button>
            <Button
              htmlType="button"
              onClick={onReset}
              disabled={!isFormTouched || settingsIsUpdating}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export const SettingsWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Settings />
    </Suspense>
  );
};
