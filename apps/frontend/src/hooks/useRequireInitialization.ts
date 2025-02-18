import { useNavigate } from "react-router";
import { useAppInitialization } from "./useInitialization";
import { useEffect } from "react";

export const useRequireInitialization = ({
  require,
}: {
  require: "to-be-initialized" | "not-to-be-initialized";
}) => {
  const navigate = useNavigate();
  const { isInitialized } = useAppInitialization();

  useEffect(() => {
    if (require === "not-to-be-initialized" && isInitialized === true) {
      navigate("/", { viewTransition: true });
    } else if (require === "to-be-initialized" && isInitialized === false) {
      navigate("/setup", { viewTransition: true });
    }
  }, [isInitialized]);
};
