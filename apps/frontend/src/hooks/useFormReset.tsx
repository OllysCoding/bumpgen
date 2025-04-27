import { Button, Form, FormInstance } from "antd";
import { useCallback, useState } from "react";

export const useFormReset = ({
  form,
  disableButton,
}: {
  form: FormInstance;
  disableButton?: boolean;
}) => {
  const [isTouched, setIsTouched] = useState(false);

  Form.useWatch(() => {
    setIsTouched(form.isFieldsTouched());
  }, form);

  const onReset = useCallback(() => {
    form.resetFields();
  }, [form]);

  const ResetButton: React.FC = useCallback(() => {
    return (
      <Button
        htmlType="button"
        onClick={onReset}
        disabled={!isTouched || disableButton}
      >
        Reset
      </Button>
    );
  }, [disableButton, isTouched, onReset]);

  return {
    isTouched,
    ResetButton,
  };
};
