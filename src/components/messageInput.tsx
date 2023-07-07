import { IconButton } from "./iconButton";

type Props = {
  userMessage: string;
  isMicRecording: boolean;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

// 纯 UI 组件，下边输入栏的显示
export const MessageInput = ({
  userMessage,
  isMicRecording,
  isChatProcessing,
  onChangeUserMessage,
  onClickMicButton,
  onClickSendButton,
}: Props) => {
  return (
    <div className="absolute bottom-0 z-20 w-screen">
      <div className="bg-base text-black">
        <div className="mx-auto max-w-4xl p-16">
          <div className="grid grid-flow-col gap-[8px] grid-cols-[min-content_1fr_min-content]">
            <IconButton
              iconName="24/Microphone"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={isMicRecording}
              // 聊天处理中的时候禁止说话
              disabled={isChatProcessing}
              onClick={onClickMicButton}
            />
            <input
              type="text"
              // placeholder="聞きたいことをいれてね"
              placeholder="告诉我你想听什么"
              onChange={onChangeUserMessage}
              // 聊天处理中的时候禁止输入
              disabled={isChatProcessing}
              className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 disabled:bg-surface1-disabled disabled:text-primary-disabled rounded-16 w-full px-16 text-text-primary typography-16 font-M_PLUS_2 font-bold disabled"
              value={userMessage}
            ></input>

            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              // 聊天处理中的时候显示加载图标
              isProcessing={isChatProcessing}
              // 聊天处理中的时候禁止发送
              disabled={isChatProcessing || !userMessage}
              onClick={onClickSendButton}
            />
          </div>
        </div>
        {/* 无用的说明，到时候再研究一下需不需要在页面上说明 */}
        {/* <div className="py-4 bg-[#413D43] text-center text-white font-Montserrat">
          powered by VRoid, Koeiro API, ChatGPT API
        </div> */}
      </div>
    </div>
  );
};
