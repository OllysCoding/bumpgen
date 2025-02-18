import type { Result } from "../result/index.js";

export interface BumpgenService {
  load: () => Promise<Result<unknown>>;
  unload: () => Promise<Result<unknown>>;
  run: () => Promise<Result<unknown>>;
}
