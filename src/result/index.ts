export enum ResultStatus {
  SUCCESS,
  ERROR,
}

export interface Failure {
  message: string;
  e?: unknown;
}

export interface SuccessResult<T> {
  status: ResultStatus.SUCCESS;
  result: T;
}
export interface FailureResult {
  status: ResultStatus.ERROR;
  error: Failure;
}

export type Result<T> = SuccessResult<T> | FailureResult;

export const success = <T>(result: T): SuccessResult<T> => {
  return {
    status: ResultStatus.SUCCESS,
    result,
  };
};

export const failure = (message: string, e?: unknown): FailureResult => {
  return {
    status: ResultStatus.ERROR,
    error: {
      message,
      e: e ?? undefined,
    },
  };
};

export const isSuccess = <T>(result: Result<T>): result is SuccessResult<T> =>
  result.status === ResultStatus.SUCCESS;

export const isFailure = <T>(result: Result<T>): result is FailureResult =>
  result.status === ResultStatus.ERROR;

export const unwrap = <T>(result: Result<T>): T | undefined => {
  if (isSuccess(result)) return result.result;
  else return undefined;
};
