/**
 * issues: 
 * 1. Uncaught DOMException: Failed to execute 'start' on 'SpeechRecognition': recognition has already started.
 */
import { MessageInput } from "@/components/messageInput";
import { useState, useEffect, useCallback } from "react";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
};

/**
 * テキスト入力と音声入力を提供する
 *
 * 音声認識の完了時は自動で送信し、返答文の生成中は入力を無効化する
 * 
 * 
 * 提供文字输入和语音输入
 *
 * 语音识别完成时自动发送，并在生成响应时禁用输入
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);

  // 音声認識の結果を処理する
  // 处理语音识别结果，当语音识别服务返回结果时，会触发 Web Speech API 的 result 事件 - 单词或短语已被正确识别，并且已被传达回应用程序
  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setUserMessage(text);

      // 発言の終了時
      // 演讲结束
      if (event.results[0].isFinal) {
        setUserMessage(text);
        // 返答文の生成を開始
        // 开始生成响应文本
        onChatProcessStart(text);
      }
    },
    [onChatProcessStart]
  );

  // 無音が続いた場合も終了する
  // 即使沉默持续也终止，当语音识别服务断开连接时，将触发 Web Speech API SpeechRecognition 对象的 end 事件。
  const handleRecognitionEnd = useCallback(() => {
    setIsMicRecording(false);
  }, []);

  // 当用户按下语音按钮时，这里没有防抖处理，于是乎就会重复触发，重复 start，然后报错
  const handleClickMicButton = useCallback(() => {
    // 如果正在 Recording 就需要停止，但是 isMicRecording 的状态并不会那么及时
    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);

      return;
    }

    speechRecognition?.start();
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);

  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  useEffect(() => {
    // https://developer.mozilla.org/zh-CN/docs/Web/API/SpeechRecognition
    // 浏览器自带的语音识别技术，还是需要将语音发送给 Google 进行处理，所以这个可以作为免费方案？
    // 如果这个方案不能用，就只能使用微软语音方案了，或者手动接一接谷歌方案？
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    // FirefoxなどSpeechRecognition非対応環境対策
    // SpeechRecognition 不合规环境措施，例如 Firefox
    // Firefox 不支持 SpeechRecognition，看来到时候要做些兼容
    if (!SpeechRecognition) {
      return;
    }
    const recognition = new SpeechRecognition();
    // recognition.lang = "ja-JP";
    // 改成识别中文，多语言识别可以吗？
    recognition.lang = "zh";

    // 返回识别的中间结果
    recognition.interimResults = true; // 認識の途中結果を返す
    // 说话结束时结束识别
    recognition.continuous = false; // 発言の終了時に認識を終了する

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={isChatProcessing}
      isMicRecording={isMicRecording}
      onChangeUserMessage={(e) => setUserMessage(e.target.value)}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
};
