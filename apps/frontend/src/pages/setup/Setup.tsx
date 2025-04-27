import { Suspense, useEffect } from "react";
import { Loading } from "../../components/Loading";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import { App, Button, Form, Input, Radio, Typography } from "antd";
import {
  InitializeData,
  useAppInitialization,
} from "../../hooks/useInitialization";
import { DOCKER_DEFAULTS } from "./defaults";

type FieldType = InitializeData & { useDockerDefaults: "yes" | "no" };

const Setup: React.FC = () => {
  useRequireInitialization({ require: "not-to-be-initialized" });

  const { message } = App.useApp();

  const { initialize, isInitializing } = useAppInitialization();

  const [form] = Form.useForm<FieldType>();
  const useDockerDefaults = Form.useWatch<FieldType["useDockerDefaults"]>(
    "useDockerDefaults",
    form,
  );

  useEffect(() => {
    if (useDockerDefaults === "yes") {
      form.setFieldsValue({ ...DOCKER_DEFAULTS });
    } else {
      form.setFieldsValue({
        outputFolder: "",
        backgroundContentFolder: "",
      });
    }
  }, [useDockerDefaults, form]);

  const onFinish = async (data: FieldType) => {
    try {
      await initialize(data);
      message.success("Bumpgen has been set up!");
    } catch (err) {
      console.error(err);
      message.error("Something went wrong when trying to set up bumpgen");
    }
  };

  return (
    <>
      <Typography.Title level={2}>Setup Bumpgen</Typography.Title>
      <Form
        disabled={isInitializing}
        form={form}
        name="setup"
        layout="vertical"
        requiredMark="optional"
        onFinish={onFinish}
        style={{ maxWidth: 400, width: 400 }}
      >
        <Form.Item<FieldType>
          label="XML TV Url"
          name="xmlTvUrl"
          tooltip="URL to your XMLTV file, used to fetch info on your channels & programmes. Most likely ends in .xml"
          rules={[
            { required: true, message: "Please provide XMLTV URL" },
            { type: "url" },
          ]}
        >
          <Input placeholder="e.g 'https://your.iptv.server/xmltv.xml'" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Language"
          name="language"
          tooltip="The language to use for pulling programme information from your XMLTV file. Should match 'lang' attributes in your XMLTV file"
          rules={[{ required: true }]}
        >
          <Input placeholder="e.g 'en'" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Use docker defaults for output folders?"
          name="useDockerDefaults"
          tooltip="Leave as 'yes' if you used the provided default docker config. If you changed any of the docker paths within the container, or are using a manual setup, pick 'no' and enter manually"
          rules={[{ required: true }]}
          initialValue={"yes"}
        >
          <Radio.Group>
            <Radio value="yes"> Yes </Radio>
            <Radio value="no"> No </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item<FieldType>
          label="Output Folder"
          name="outputFolder"
          tooltip="Folder path to output bumper content to"
          rules={[{ required: true }]}
        >
          <Input
            placeholder={`e.g '${DOCKER_DEFAULTS.outputFolder}'`}
            disabled={useDockerDefaults === "yes"}
          />
        </Form.Item>
        <Form.Item<FieldType>
          label="Background Content Folder"
          name="backgroundContentFolder"
          tooltip="Folder path that contains background content video files which will play behind the overlay in your bumper content"
          rules={[{ required: true }]}
        >
          <Input
            placeholder={`e.g '${DOCKER_DEFAULTS.backgroundContentFolder}'`}
            disabled={useDockerDefaults === "yes"}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Get Started
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export const SetupWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Setup />
    </Suspense>
  );
};
