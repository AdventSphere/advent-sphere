import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { usePostRooms } from "common/generate/room/room";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
  Copy,
  Gift,
  Info,
  LinkIcon,
  Lock,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
// import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// zodスキーマ定義
const formSchema = z
  .object({
    start_at: z.union([
      z.string().min(1, "開始日を選択してください"),
      z.date(),
    ]),
    item_get_time: z.union([z.string(), z.date()]).optional(),
    password: z.string(),
    is_anonymous: z.union([z.boolean(), z.literal("")]),
  })
  .refine(
    (data) => {
      // start_atが空文字でないことを確認
      if (typeof data.start_at === "string" && data.start_at === "") {
        return false;
      }
      return true;
    },
    {
      message: "開始日は必須です",
      path: ["start_at"],
    },
  );

type FormData = z.infer<typeof formSchema>;

export const Route = createFileRoute("/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [usePassword, setUsePassword] = useState(false);
  const [successData, setSuccessData] = useState({
    editUrl: "",
    password: "",
  });
  const { mutateAsync: postRooms } = usePostRooms();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_at: new Date(2025, 11, 1), // 2025年12月1日
      item_get_time: "",
      password: "",
      is_anonymous: true,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormData) => {
    try {
      console.log("送信データ:", data);

      // APIに送信するデータ形式に変換
      const apiData = {
        ownerId: "temp_user_id", // TODO: 実際のユーザーIDを取得
        startAt:
          data.start_at instanceof Date
            ? data.start_at.toISOString()
            : data.start_at,
        itemGetTime:
          data.item_get_time === ""
            ? undefined
            : data.item_get_time instanceof Date
              ? data.item_get_time.toISOString()
              : data.item_get_time,
        password: data.password || undefined,
        isAnonymous: data.is_anonymous as boolean,
      };

      console.log("API送信データ:", apiData);

      // 実際のAPI呼び出し
      const response = await postRooms({ data: apiData });

      setSuccessData({
        editUrl: `https://advent-sphere.com/edit/${response.editId}`,
        password: data.password || "",
      });
    } catch (error) {
      console.error("エラー:", error);
      if (error instanceof Error) {
        alert(`作成に失敗しました: ${error.message}`);
      } else {
        alert("作成に失敗しました");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 日付の表示用計算
  const displayDate = () => {
    if (typeof watchedValues.start_at === "object" && watchedValues.start_at) {
      const startDate = watchedValues.start_at;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 24);
      return {
        from: startDate,
        to: endDate,
      };
    }
    return null;
  };

  // アイテム取得時間の計算
  const isRandomTime =
    !watchedValues.item_get_time || watchedValues.item_get_time === "";

  if (successData.editUrl) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-secondary p-4">
        <div className="w-full max-w-md bg-white rounded-lg flex flex-col px-4 py-8 gap-6 text-center">
          <h1 className="w-full text-lg sm:text-xl font-bold">
            アドベントカレンダーが作成されました！
          </h1>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="text-primary" />
                <span className="text-sm font-semibold">編集リンク</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={successData.editUrl}
                  readOnly
                  className="flex-1 text-sm p-2 h-auto focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(successData.editUrl)}
                  className="w-8 h-8 p-0 bg-primary hover:bg-green-700 text-white"
                >
                  <Copy className="w-4 h-4  text-white" />
                </Button>
              </div>
            </div>

            {successData.password && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="text-primary" />
                  <span className="text-sm font-semibold">編集用合言葉</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={successData.password}
                    readOnly
                    className="flex-1 text-sm p-2 h-auto focus-visible:ring-0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(successData.password)}
                    className="w-8 h-8 p-0 bg-primary hover:bg-green-700 text-white"
                  >
                    <Copy className="w-4 h-4  text-white" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button>
            {/*<Link to="/">*/}
            編集へ
            {/*</Link>*/}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-secondary p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl bg-white rounded-lg flex flex-col px-4 sm:px-8 md:px-16 lg:px-24 gap-6 justify-center py-6 sm:py-8"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-center">
          アドベントカレンダーを作ろう！
        </h1>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <CalendarDays className="text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">
              期間（25日間固定）
            </h2>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full sm:w-95 justify-start text-left font-normal",
                  !watchedValues.start_at && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {(() => {
                  const dates = displayDate();
                  return dates ? (
                    <>
                      {format(dates.from, "yyyy/MM/dd")} ～{" "}
                      {format(dates.to, "yyyy/MM/dd")}
                    </>
                  ) : (
                    <span>期間を選択</span>
                  );
                })()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                defaultMonth={
                  typeof watchedValues.start_at === "object"
                    ? watchedValues.start_at
                    : undefined
                }
                selected={
                  typeof watchedValues.start_at === "object"
                    ? watchedValues.start_at
                    : undefined
                }
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setValue("start_at", selectedDate);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {errors.start_at && (
            <p className="text-sm text-red-500">{errors.start_at.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            <Gift className="text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">
              アイテムゲット時間
            </h2>
          </div>
          <RadioGroup
            value={isRandomTime ? "random" : "specialized"}
            onValueChange={(value) => {
              if (value === "random") {
                setValue("item_get_time", "");
              } else {
                setValue("item_get_time", new Date(`2024-01-01T10:30:00`));
              }
            }}
            className="flex flex-col gap-2"
          >
            <Label htmlFor="random" className="cursor-pointer">
              <div
                className={`flex w-full flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all gap-2 border-2 ${
                  isRandomTime
                    ? "border-primary bg-green-50"
                    : "border-transparent bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="random" id="random" />
                  <div>
                    <div className="text-base font-normal">ランダム</div>
                    <div className="text-sm text-muted-foreground">
                      毎日違う時間にサプライズ
                    </div>
                  </div>
                </div>
                <div className="bg-primary rounded text-white px-2 py-1 text-xs sm:text-sm self-center text-center min-w-20">
                  おすすめ
                </div>
              </div>
            </Label>
            <Label htmlFor="specialized" className="cursor-pointer">
              <div
                className={`flex flex-col w-full sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all gap-2 border-2 ${
                  !isRandomTime
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specialized" id="specialized" />
                  <div>
                    <div className="text-base font-normal">指定した時間</div>
                    <div className="text-sm text-muted-foreground">
                      毎日同じ時間にお届け
                    </div>
                  </div>
                </div>
                <Input
                  type="time"
                  id="time-picker"
                  defaultValue="10:30"
                  onChange={(e) => {
                    if (!isRandomTime && e.target.value) {
                      const timeDate = new Date(
                        `2024-01-01T${e.target.value}:00`,
                      );
                      setValue("item_get_time", timeDate);
                    }
                  }}
                  className={`w-28 text-right font-mono bg-white self-center min-w-22 px-3 ${
                    isRandomTime ? "opacity-50 pointer-events-none" : ""
                  }`}
                  readOnly={isRandomTime}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </Label>
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex gap-2 items-center">
              <Lock className="text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">
                編集用合言葉を使う
              </h2>
            </div>
            <Switch
              id="use-passphrase"
              checked={usePassword}
              onCheckedChange={(checked) => {
                setUsePassword(checked);
                if (!checked) {
                  setValue("password", "");
                }
              }}
            />
          </div>
          {usePassword && (
            <div className="flex flex-col gap-1">
              <Input
                type="text"
                placeholder="合言葉を入力してください"
                {...register("password")}
                className="w-full sm:w-75"
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex gap-2 items-center">
            <UsersRound className="text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">
              参加者の名前を公開する
            </h2>
          </div>
          <Switch
            id="show-participant-names"
            checked={!!watchedValues.is_anonymous}
            onCheckedChange={(checked) => {
              setValue("is_anonymous", checked);
            }}
          />
        </div>
        <div className="flex gap-2 items-center bg-yellow-50 p-3 sm:p-4 rounded-lg  text-yellow-800">
          <Info className="shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm">
            このカレンダーは期間終了後90日でデータが削除されます
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-full sm:w-36"
            disabled={isSubmitting}
          >
            {isSubmitting ? "作成中..." : "作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
