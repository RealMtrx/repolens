import { SCORE_WEIGHTS_DEFAULT } from "../constants/index.js";
import type { RepoLensConfig, ScoreWeights } from "../types/index.js";

let config: RepoLensConfig = {};

export function loadConfig(userConfig?: Partial<RepoLensConfig>): RepoLensConfig {
  config = {
    excludePatterns: userConfig?.excludePatterns,
    maxFileSize: userConfig?.maxFileSize,
    scoreWeights: userConfig?.scoreWeights ?? SCORE_WEIGHTS_DEFAULT,
  };
  return config;
}

export function getConfig(): RepoLensConfig {
  return config;
}

export function getScoreWeights(): ScoreWeights {
  return config.scoreWeights ?? SCORE_WEIGHTS_DEFAULT;
}
