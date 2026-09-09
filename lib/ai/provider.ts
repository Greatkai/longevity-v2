/**
 * AI 服务调用辅助
 * 支持 OpenAI 兼容接口；未配置时调用方需使用规则兜底。
 */

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function callAI(
  messages: ChatMessage[],
  maxTokens = 1200
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("AI 调用失败:", e);
    return null;
  }
}

/** 请求 AI 提取健康数据 */
export async function aiExtract(text: string): Promise<string | null> {
  const system = `你是一名健康评估数据提取助手。请从用户的健康描述文本中提取结构化数据，只返回 JSON，不要输出其他内容。
必须返回如下结构的 JSON（所有字段都不能省略，未知的用 null）：
{
  "bio": {"actualAge": number|null, "biologicalAge": number|null, "immunity": number|null},
  "functional": {"adl": number|null},
  "metabolic": {"bmi": number|null, "systolicBP": number|null, "diastolicBP": number|null, "hba1c": number|null, "fastingGlucose": number|null, "ldl": number|null, "chronicCount": number|null, "chronicControl": number|null},
  "lifestyle": {"diet": number|null, "sleepHours": number|null, "sleepQuality": number|null, "weeklyExercise": number|null, "smoking": number|null, "alcohol": number|null, "weightManagement": number|null, "stress": number|null},
  "psychosocial": {"mood": number|null, "cognitiveHealth": number|null, "loneliness": number|null, "purpose": number|null, "socialActivity": number|null},
  "digital": {"regularCheckup": number|null, "wearable": number|null, "recordContinuity": number|null, "adherence": number|null}
}
字段说明：adl/mood/cognitiveHealth/loneliness/purpose/immunity/sleepQuality/weightManagement 为1-5；diet/recordContinuity 为0-10；weeklyExercise 为0-7；smoking 0从不1已戒2偶尔3经常；alcohol 0从不1少量2经常；regularCheckup 0-1；wearable 0不使用1偶尔2经常；hba1c 单位%；ldl/fastingGlucose 单位mmol/L；chronicControl 0差1一般2良好。`;
  return await callAI([
    { role: "system", content: system },
    { role: "user", content: text },
  ]);
}

/** 功能医学问卷题目目录条目（用于 AI 提取） */
export interface FMCatalogItem {
  qid: string;
  text: string;
  type: string;
  options?: string[];
}

/**
 * 请求 AI 从健康描述中提取功能医学问卷答案
 * 返回 qid -> 答案 的 JSON 字符串（仅包含能确定的题目）
 */
export async function aiExtractFM(
  text: string,
  catalog: FMCatalogItem[]
): Promise<string | null> {
  const system = `你是一名功能医学问卷数据提取助手。下面给出问卷题目清单（JSON 数组，含 qid、text 题干、type 题型、options 选项）。
请从用户的健康描述中提取**能确定**的题目答案，只返回一个 JSON 对象：{"qid": 答案, ...}，不要输出其他内容。
答案规则：
- radio：必须使用 options 中的**选项原文**
- checkbox：返回选项原文数组（只含明确提到的项）
- foodfreq：返回 {"freq": "每天|每周|每月|不吃", "count": 次数数字, "amount": "大碗|中碗|小碗|大份|中份|小份"}（count/amount 可省略）
- diseasehist：返回 {"status": "有|无|不详", "detail": "年份或情况说明，可省略"}
- number：返回数字；text/textarea：返回字符串
- 描述中未提及或无法确定的题目**不要输出**；
- 注意否定表述（如"没有糖尿病"不能回答"有"）。

题目清单：
${JSON.stringify(catalog)}`;
  return await callAI(
    [
      { role: "system", content: system },
      { role: "user", content: text },
    ],
    3000
  );
}

/** 请求 AI 生成个性化解读与建议 */
export async function aiInsights(profile: string): Promise<string | null> {
  const system = `你是一位资深健康管理与抗衰老专家。请根据用户的长寿评估数据，生成一份专业、温暖、实用的个性化健康解读与建议。
要求：
1. 用中文输出，语言专业但亲切，避免恐吓性表述。
2. 结构清晰，使用 Markdown 小标题，如「## 总体评估」「## 优势维度」「## 重点关注」「## 改善建议」。
3. 结合六大维度得分具体分析，指出优势与风险。
4. 给出 3-5 条具体、可操作的生活方式改善建议。
5. 内容务实，与提供的分数匹配，不要凭空发挥。`;
  return await callAI([
    { role: "system", content: system },
    { role: "user", content: profile },
  ]);
}
