import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Button, Watermark, Typography } from "antd";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

type Props = {
  children: React.ReactNode;
};

export const SuspenseErrorBoundary: React.FC<Props> = ({ children }) => {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ReactErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary, error }) => (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <Typography.Paragraph code={true}>
            {error.toString()}
          </Typography.Paragraph>
          <Button onClick={() => resetErrorBoundary()}>Try again</Button>
        </div>
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
};
