import { VRMExpression, VRMExpressionPresetName } from "@pixiv/three-vrm";
import { KoeiroParam } from "../constants/koeiroParam";

// ChatGPT API
export type Message = {
  role: "assistant" | "system" | "user";
  content: string;
};

const talkStyles = [
  "talk",
  "happy",
  "sad",
  "angry",
  "fear",
  "surprised",
] as const;
export type TalkStyle = (typeof talkStyles)[number];

export type Talk = {
  style: TalkStyle;
  speakerX: number;
  speakerY: number;
  message: string;
};

const emotions = ["neutral", "happy", "angry", "sad", "relaxed"] as const;
type EmotionType = (typeof emotions)[number] & VRMExpressionPresetName;

/**
 * 発話文と音声の感情と、モデルの感情表現がセットになった物
 * 一组话语、语音情感、模型的情感表达
 */
export type Screenplay = {
  expression: EmotionType;
  talk: Talk;
};

export const splitSentence = (text: string): string[] => {
  const splitMessages = text.split(/(?<=[。．！？\n])/g);
  return splitMessages.filter((msg) => msg !== "");
};

// 将 ChatGPT 的话转化成带情绪的一段段模型要说的话
export const textsToScreenplay = (
  texts: string[],
  koeiroParam: KoeiroParam
): Screenplay[] => {
  const screenplays: Screenplay[] = [];
  let prevExpression = "neutral";
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    const match = text.match(/\[(.*?)\]/);

    // 匹配出每句话的情感标签
    const tag = (match && match[1]) || prevExpression;

    // 匹配出要说的话
    const message = text.replace(/\[(.*?)\]/g, "");

    let expression = prevExpression;
    // 看看情绪是不是在系统定的几个情绪之间，如果不是，则默认为中性
    if (emotions.includes(tag as any)) {
      // 如果是，则改变下面两个变量
      expression = tag;
      prevExpression = tag;
    }

    screenplays.push({
      expression: expression as EmotionType,
      talk: {
        style: emotionToTalkStyle(expression as EmotionType),
        // 感觉是说话的语速什么的？
        speakerX: koeiroParam.speakerX,
        speakerY: koeiroParam.speakerY,
        // 说的话
        message: message,
      },
    });
  }

  return screenplays;
};

// 将提示词中的情绪（模型的表情）转化成语音合成 API 的情绪
const emotionToTalkStyle = (emotion: EmotionType): TalkStyle => {
  switch (emotion) {
    case "angry":
      return "angry";
    case "happy":
      return "happy";
    case "sad":
      return "sad";
    // 其他的都只是普通的说话
    default:
      return "talk";
  }
};
