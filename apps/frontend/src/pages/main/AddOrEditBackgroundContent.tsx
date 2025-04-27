import { Suspense, useMemo, useState } from "react";
import { Loading } from "../../components/Loading";
import { useParams } from "react-router";
import { BackgroundContentConfig, useSettings } from "../../hooks/useSettings";
import { useRequireInitialization } from "../../hooks/useRequireInitialization";
import {
  App,
  Button,
  Form,
  InputNumber,
  Select,
  Space,
  Typography,
} from "antd";
import { useSuspenseCache } from "../../hooks/useCache";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useAppNavigation } from "../../hooks/useAppNavigation";

type FieldType = {
  filepath: string;
  windows: { start: number; end: number }[];
};

const AddOrEditBackgroundContent: React.FC = () => {
  useRequireInitialization({ require: "to-be-initialized" });
  const {
    backgroundContentConfigs,
    createBackgroundContentConfig,
    updateBackgroundContentConfig,
    backgroundContentIsCreating,
    backgroundContentIsUpdating,
  } = useSettings();
  const cache = useSuspenseCache();

  const { filepath } = useParams<"filepath">();
  const { navigateToBackgroundContent } = useAppNavigation();

  const { message } = App.useApp();
  const [form] = Form.useForm<FieldType>();
  const [isFormTouched, setIsFormTouched] = useState(false);

  Form.useWatch(() => {
    setIsFormTouched(form.isFieldsTouched());
  }, form);

  const selectedFile = Form.useWatch("filepath", form) ?? filepath;

  const backgroundContent = useMemo(() => {
    return cache.backgroundContent.find(
      (file) => file.relativePath === selectedFile,
    );
  }, [cache.backgroundContent, selectedFile]);

  const onReset = () => {
    form.resetFields();
  };

  const unusedFiles = useMemo(() => {
    return Object.values(cache.backgroundContent).filter(
      (file) => !backgroundContentConfigs[file.relativePath],
    );
  }, [backgroundContentConfigs, cache.backgroundContent]);

  const backgroundContentConfig: BackgroundContentConfig | undefined = filepath
    ? backgroundContentConfigs[filepath]
    : undefined;

  const onFinish = async (data: FieldType) => {
    try {
      if (filepath) {
        // Update
        await updateBackgroundContentConfig({
          filePath: filepath,
          backgroundContentConfig: {
            windows: data.windows.map(({ start, end }) => [start, end]),
          },
        });
        message.success(`Updated config for '${filepath}'!`);
        navigateToBackgroundContent();
      } else if (data.filepath) {
        // Create
        await createBackgroundContentConfig({
          filePath: data.filepath,
          backgroundContentConfig: {
            windows: data.windows.map(({ start, end }) => [start, end]),
          },
        });
        message.success(`Created config for '${filepath}'!`);
        navigateToBackgroundContent();
      } else {
        throw Error("Not creating or updating");
      }
    } catch (err) {
      console.error(err);
      message.error("Something went wrong saving your background content");
    }
  };

  return (
    <>
      <Typography.Title level={2}>
        {backgroundContentConfig
          ? `Editing ${filepath}`
          : "Add new background content config"}
      </Typography.Title>
      <Form<FieldType>
        layout="vertical"
        form={form}
        onFinish={onFinish}
        disabled={backgroundContentIsCreating || backgroundContentIsUpdating}
      >
        {backgroundContentConfig === undefined && (
          <Form.Item<FieldType>
            label="File"
            name="filepath"
            tooltip="The filepath of the background content you want to configure, relative to your background content folder"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select a option and change input text above"
              allowClear
            >
              {unusedFiles.map((file) => (
                <Select.Option value={file.relativePath}>
                  {file.relativePath}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.List
          name="windows"
          initialValue={
            backgroundContentConfig === undefined
              ? []
              : backgroundContentConfig.windows.map(([start, end]) => ({
                  start,
                  end,
                }))
          }
          rules={[
            {
              validator: async (_, windows) => {
                if (!windows || windows.length < 1) {
                  return Promise.reject(
                    new Error("At least one window is required"),
                  );
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              <Typography.Title level={5}>Windows</Typography.Title>
              <Typography.Paragraph>
                Windows can be used to specific specific sections of your
                background content for bumpgen to use. <br></br>
                <br></br> For example, you may have a 60 seconds clip, but only
                want to use the section from 10s-50s. <br></br>A piece of
                background content can have multiple windows, which are able to
                overlap, for example 10s-30s & 20s-40s. When bumpgen finds
                multiple windows which fit the desired length of a bumper video,
                it will pick one at random.
              </Typography.Paragraph>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    label="Start"
                    layout="horizontal"
                    name={[name, "start"]}
                    rules={[
                      { required: true, message: "Missing start timestamp" },
                      {
                        type: "number",
                        min: 0,
                        max: backgroundContent?.length,
                        message: backgroundContent?.length
                          ? `Must be between 0s & ${backgroundContent.length}s`
                          : "Must be above 0s",
                      },
                    ]}
                  >
                    <InputNumber placeholder="0s" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label="End"
                    name={[name, "end"]}
                    layout="horizontal"
                    rules={[
                      { required: true, message: "Missing end timestamp" },
                      {
                        type: "number",
                        min: 0,
                        max: backgroundContent?.length,
                        message: backgroundContent?.length
                          ? `Must be between 0s & ${backgroundContent.length}s`
                          : "Must be above 0s",
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder={`${Math.round(backgroundContent?.length ?? 0)}s`}
                    />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Space>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    disabled={!filepath && !form.getFieldValue("filepath")}
                    icon={<PlusOutlined />}
                  >
                    Add window
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Space>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!isFormTouched}
              loading={
                backgroundContentIsCreating || backgroundContentIsUpdating
              }
            >
              Save
            </Button>
            <Button
              htmlType="button"
              onClick={onReset}
              disabled={
                !isFormTouched ||
                backgroundContentIsCreating ||
                backgroundContentIsUpdating
              }
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export const AddOrEditBackgroundContentWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <AddOrEditBackgroundContent />
    </Suspense>
  );
};
