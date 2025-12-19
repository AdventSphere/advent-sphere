import {
  type CreatePromptRequestHistoryItem,
  CreatePromptRequestHistoryItemRole,
} from "common/generate/adventSphereAPI.schemas";
import {
  usePostAiCreatePhoto,
  usePostAiCreatePrompt,
} from "common/generate/ai/ai";
import { ArrowUp, ChevronLeft, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import InventoryIcon from "@/components/icons/inventory";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiGenerationScreenProps {
  onBack: () => void;
  roomId: string;
  onAdopt?: (base64Image: string) => void;
}

export default function AiGenerationScreen({
  onBack,
  roomId,
  onAdopt,
}: AiGenerationScreenProps) {
  // State
  const [viewState, setViewState] = useState<"chat" | "result">("chat");
  const [prompt, setPrompt] = useState<string>("");
  const [history, setHistory] = useState<CreatePromptRequestHistoryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Hooks
  const createPromptMutation = usePostAiCreatePrompt();
  const createPhotoMutation = usePostAiCreatePhoto();

  // Scroll to bottom of chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewState === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, viewState]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: CreatePromptRequestHistoryItem = {
      role: CreatePromptRequestHistoryItemRole.user,
      content: inputValue,
    };

    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    // setInputValue(""); // Input is cleared after mutation starts or optimistically? Usually cleared immediately for UX
    // But waiting for mutation prevents double submit or allows retry if failed.
    // Let's clear immediately as per original code, but I'll stick to original logic order if possible.
    setInputValue("");

    // Call API to generating/updating prompt
    createPromptMutation.mutate(
      {
        data: {
          prompt: prompt,
          history: newHistory,
        },
      },
      {
        onSuccess: (data) => {
          // Update prompt with the new one
          setPrompt(data.prompt);
          // Add model response to history
          setHistory((prev) => [
            ...prev,
            {
              role: CreatePromptRequestHistoryItemRole.model,
              content: data.feedback,
            },
          ]);
        },
        onError: (error) => {
          console.error("Failed to create prompt", error);
          // Optionally handle error state in chat
        },
      },
    );
  };

  const handleGeneratePhoto = () => {
    createPhotoMutation.mutate(
      {
        data: {
          prompt: prompt,
          roomId: roomId,
        },
      },
      {
        onSuccess: (data) => {
          setGeneratedImage(data.imageData);
          setViewState("result");
        },
        onError: (error) => {
          console.error("Failed to generate photo", error);
        },
      },
    );
  };

  const handleAdopt = () => {
    if (generatedImage && onAdopt) {
      onAdopt(generatedImage);
    } else {
      // If no handler, maybe just log or do nothing?
      console.warn("No onAdopt handler provided");
    }
  };

  if (viewState === "result" && generatedImage) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-[#F5F5F5] p-6 text-foreground relative">
        {/* Header */}
        <div className="flex flex-col items-start gap-4 mb-6">
          <button
            onClick={() => setViewState("chat")}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            写真アップロードに戻る
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <InventoryIcon className="w-6 h-6 text-[#006400]" />
            </div>
            <h1 className="text-2xl font-bold text-[#006400]">
              写真をAIで生成する
            </h1>
          </div>
        </div>

        {/* Result Content */}
        <div className="flex-1 flex flex-col items-center justify-center pb-24">
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-lg bg-[url('/checker-board.png')] bg-repeat">
            {/* Note: checker-board path is illustrative, using simple gray bg as fallback if not exists or the CSS from screenshot */}
            <div className="absolute inset-0 bg-[#e0e0e0] opacity-50 pointer-events-none" />
            <img
              src={generatedImage}
              alt="Generated Result"
              className="relative z-10 w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-6 left-0 right-0 px-6 pointer-events-none">
          <div className="max-w-[700px] mx-auto w-full pointer-events-auto">
            <Button
              onClick={handleAdopt}
              className="w-full bg-[#920209] hover:bg-[#7a0207] text-white font-bold text-lg h-14 rounded-2xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              写真を採用
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F5F5F5] p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          写真アップロードに戻る
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <InventoryIcon className="w-6 h-6 text-[#006400]" />
          </div>
          <h1 className="text-2xl font-bold text-[#006400]">
            写真をAIで生成する
          </h1>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Left Column: Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Photo Frame Section */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">フォトフレーム</h2>
            <div className="w-full aspect-video bg-transparent flex items-center justify-center">
              {/* This image mimics the one in the screenshot with two frames */}
              <img
                src="/placeholder-frames.png"
                alt="Photo Frames"
                className="max-w-full h-auto object-contain"
                onError={(e) => {
                  // Fallback if image doesn't exist (likely doesn't)
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.classList.add(
                    "bg-white",
                    "rounded-xl",
                    "border-2",
                    "border-dashed",
                    "border-gray-300",
                  );
                  e.currentTarget.parentElement!.innerText =
                    "フォトフレーム画像";
                }}
              />
            </div>
            {/* Thumbnail of previously generated image could be shown here if we want, but logic separates views now */}
          </div>

          {/* Current Prompt Section */}
          <div className="flex flex-col gap-2 flex-1">
            <h2 className="text-sm font-bold">現状のプロンプト</h2>
            <div className="bg-white rounded-3xl p-6 shadow-sm flex-1 min-h-[200px]">
              <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                {prompt}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-sm overflow-hidden h-[600px] lg:h-auto relative">
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {history.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full",
                  item.role === CreatePromptRequestHistoryItemRole.user
                    ? "justify-end"
                    : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    item.role === CreatePromptRequestHistoryItemRole.user
                      ? "bg-[#F3F4F6] text-gray-800 rounded-tr-sm"
                      : "bg-[#F3F4F6] text-gray-800 rounded-tl-sm",
                  )}
                >
                  {item.content}
                </div>
              </div>
            ))}
            {createPromptMutation.isPending && (
              <div className="flex justify-start w-full">
                <div className="bg-[#F3F4F6] text-gray-500 px-4 py-3 rounded-2xl rounded-tl-sm text-sm">
                  考え中...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="relative flex items-end">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="生成したい画像"
                className="w-full bg-[#F3F4F6] text-gray-800 placeholder:text-gray-400 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none min-h-[56px]"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || createPromptMutation.isPending}
                className="absolute right-2 bottom-2.5 p-1.5 bg-[#920209] text-white rounded-lg hover:bg-[#7a0207] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Action Button */}
      <div className="fixed bottom-6 left-0 right-0 px-6 pointer-events-none">
        <div className="max-w-[1400px] mx-auto w-full pointer-events-auto">
          <Button
            onClick={handleGeneratePhoto}
            disabled={createPhotoMutation.isPending}
            className="w-full bg-[#920209] hover:bg-[#7a0207] text-white font-bold text-lg h-14 rounded-2xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {createPhotoMutation.isPending ? "生成中..." : "AIで画像を生成する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
