"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type {
  AssessmentInput,
  AssessmentResult,
  FunctionalSummary,
} from "@/lib/chli-model";
import { DEFAULT_ASSESSMENT } from "@/lib/questionnaire-data";
import type { FMAnswers, FMStage1Score, FMSelection } from "@/lib/functional-survey/types";
import { DEFAULT_CONFIG, type AssessmentConfig } from "@/lib/functional-survey/config";

export type { AssessmentConfig };

interface AssessmentContextType {
  data: AssessmentInput;
  result: AssessmentResult | null;
  /** 评估配置（模块选择） */
  config: AssessmentConfig;
  /** 功能医学问卷答案 */
  fmAnswers: FMAnswers;
  /** Stage1 评分结果（用于动态选择 Stage2 类别） */
  fmStage1: { stage1: Record<string, FMStage1Score>; selection: FMSelection } | null;
  /** 功能医学问卷提交结果（报告展示用） */
  fmSummary: FunctionalSummary | null;
  setValue: (path: string, value: number | null) => void;
  setBulk: (updates: Record<string, number>) => void;
  setFmAnswer: (qid: string, value: unknown) => void;
  /** 批量写入功能医学问卷答案（AI 智能填写用） */
  setFmBulk: (answers: FMAnswers) => void;
  setConfig: (config: AssessmentConfig) => void;
  setFmStage1: (
    s: { stage1: Record<string, FMStage1Score>; selection: FMSelection } | null
  ) => void;
  setFmSummary: (s: FunctionalSummary | null) => void;
  /** 一次性恢复暂存的草稿（配置 + CHLI 数据 + 功能问卷答案 + Stage1 结果） */
  loadDraft: (d: {
    config: AssessmentConfig;
    chliData: AssessmentInput;
    fmAnswers: FMAnswers;
    fmStage1: { stage1: Record<string, FMStage1Score>; selection: FMSelection } | null;
  }) => void;
  reset: () => void;
  setResult: (r: AssessmentResult) => void;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

/** 根据路径设置嵌套值，如 "bio.actualAge" */
export function setNestedPath(
  obj: Record<string, unknown>,
  path: string,
  value: number | null
): Record<string, unknown> {
  const keys = path.split(".");
  const clone = structuredClone(obj) as Record<string, unknown>;
  let current = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
  return clone;
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AssessmentInput>(
    structuredClone(DEFAULT_ASSESSMENT) as unknown as AssessmentInput
  );
  const [result, setResultState] = useState<AssessmentResult | null>(null);
  const [config, setConfigState] = useState<AssessmentConfig>(DEFAULT_CONFIG);
  const [fmAnswers, setFmAnswers] = useState<FMAnswers>({});
  const [fmStage1, setFmStage1State] = useState<AssessmentContextType["fmStage1"]>(null);
  const [fmSummary, setFmSummaryState] = useState<FunctionalSummary | null>(null);

  const setValue = useCallback((path: string, value: number | null) => {
    setData((prev) =>
      setNestedPath(
        prev as unknown as Record<string, unknown>,
        path,
        value
      ) as unknown as AssessmentInput
    );
  }, []);

  const setBulk = useCallback((updates: Record<string, number>) => {
    setData((prev) => {
      let next = prev as unknown as Record<string, unknown>;
      for (const [path, value] of Object.entries(updates)) {
        next = setNestedPath(next, path, value);
      }
      return next as unknown as AssessmentInput;
    });
  }, []);

  const setFmAnswer = useCallback((qid: string, value: unknown) => {
    setFmAnswers((prev) => {
      const next: FMAnswers = { ...prev };
      next[qid] = value as FMAnswers[string];
      return next;
    });
  }, []);

  const setFmBulk = useCallback((answers: FMAnswers) => {
    setFmAnswers((prev) => ({ ...prev, ...answers }));
  }, []);

  const setConfig = useCallback((c: AssessmentConfig) => {
    setConfigState(c);
  }, []);

  const setFmStage1 = useCallback(
    (s: { stage1: Record<string, FMStage1Score>; selection: FMSelection } | null) => {
      setFmStage1State(s);
    },
    []
  );

  const setFmSummary = useCallback((s: FunctionalSummary | null) => {
    setFmSummaryState(s);
  }, []);

  const loadDraft = useCallback(
    (d: {
      config: AssessmentConfig;
      chliData: AssessmentInput;
      fmAnswers: FMAnswers;
      fmStage1: { stage1: Record<string, FMStage1Score>; selection: FMSelection } | null;
    }) => {
      setData(d.chliData);
      setConfigState(d.config);
      setFmAnswers(d.fmAnswers ?? {});
      setFmStage1State(d.fmStage1 ?? null);
      setResultState(null);
      setFmSummaryState(null);
    },
    []
  );

  const reset = useCallback(() => {
    setData(structuredClone(DEFAULT_ASSESSMENT) as unknown as AssessmentInput);
    setResultState(null);
    setConfigState(DEFAULT_CONFIG);
    setFmAnswers({});
    setFmStage1State(null);
    setFmSummaryState(null);
  }, []);

  const setResult = useCallback((r: AssessmentResult) => {
    setResultState(r);
  }, []);

  return (
    <AssessmentContext.Provider
      value={{
        data,
        result,
        config,
        fmAnswers,
        fmStage1,
        fmSummary,
        setValue,
        setBulk,
        setFmAnswer,
        setFmBulk,
        setConfig,
        setFmStage1,
        setFmSummary,
        loadDraft,
        reset,
        setResult,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment 必须在 AssessmentProvider 内使用");
  return ctx;
}
