import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePostCalendarItemsRoomIdCalendarItems } from "common/generate/calendar-items/calendar-items";
import { usePostRooms } from "common/generate/room/room";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
  Check,
  Copy,
  Gift,
  Handbag,
  Info,
  LinkIcon,
  Lock,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { R2_BASE_URL } from "@/constants/r2-url";
import { useUser } from "@/context/UserContext";
import { useGetInfiniteItems } from "@/features/edit/hooks/useGetInfiniteItems";
import NameInput from "@/features/user/nameInput";
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
    default_item_ids: z.array(z.string()),
  })
  .refine(
    (data) => {
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
    id: "",
    editId: "",
    password: "",
  });
  const [copiedStates, setCopiedStates] = useState({
    link: false,
    password: false,
  });
  // クリスマス・その他の持ち物リスト開閉状態
  const [openChristmas, setOpenChristmas] = useState(false);
  const [openAllSeason, setOpenAllSeason] = useState(false);
  const { mutateAsync: postRooms } = usePostRooms();
  const { mutateAsync: postCalendarItem } =
    usePostCalendarItemsRoomIdCalendarItems();
  const { user } = useUser();

  // アイテム一覧の取得
  const { data: itemsData, isLoading: isLoadingItems } =
    useGetInfiniteItems("all");
  const items = itemsData?.pages.flat() ?? [];

  // アイテムをカテゴリーごとに分類
  const groupedItems = useMemo(() => {
    // フォトフレーム
    const photoFrame = items.filter((item) => {
      const type = item.type;
      if (!type) return false;
      if (typeof type === "string") return type.includes("photo_frame");
      if (Array.isArray(type))
        return (type as string[]).includes("photo_frame");
      return false;
    });
    // クリスマス
    const christmas = items.filter((item) => {
      const type = item.type;
      if (!type) return false;
      if (typeof type === "string") return type.includes("christmas");
      if (Array.isArray(type)) return (type as string[]).includes("christmas");
      return false;
    });
    // フォトフレームとクリスマス以外を「オールシーズン」として扱う
    const allSeason = items.filter((item) => {
      const type = item.type;
      if (!type) return true;
      const isPhotoFrame =
        (typeof type === "string" && type.includes("photo_frame")) ||
        (Array.isArray(type) && type.includes("photo_frame"));
      const isChristmas =
        (typeof type === "string" && type.includes("christmas")) ||
        (Array.isArray(type) && type.includes("christmas"));
      return !(isPhotoFrame || isChristmas);
    });
    return { photoFrame, allSeason, christmas };
  }, [items]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_at: new Date(2025, 11, 1),
      item_get_time: "",
      password: "",
      is_anonymous: true,
      default_item_ids: [],
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormData) => {
    try {
      console.log("送信データ:", data);
      if (!user) {
        throw new Error("ユーザーが存在しません");
      }

      const apiData = {
        ownerId: user.id,
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
        isAnonymous: !data.is_anonymous as boolean,
        // バックエンドによる自動作成を防ぐため空配列を渡す
        defaultItemIds: [],
      };

      console.log("API送信データ:", apiData);

      // 1. ルーム作成（アイテムなしで作成）
      const response = await postRooms({ data: apiData });

      // 2. 持ち物（初期インベントリー）をフロントエンド主導で一括登録
      if (response.id && response.editId && data.default_item_ids.length > 0) {
        await Promise.all(
          data.default_item_ids.map((itemId) =>
            postCalendarItem({
              roomId: response.id,
              data: {
                editId: response.editId,
                calendarItem: {
                  userId: user.id,
                  roomId: response.id,
                  openDate: apiData.startAt,
                  itemId,
                  isOpened: true,
                  position: null,
                  rotation: null,
                },
              },
            }),
          ),
        );
      }

      setSuccessData({
        id: response.id,
        editId: response.editId,
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

  const copyToClipboard = (text: string, type: "link" | "password") => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [type]: false }));
    }, 2000);
  };

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

  const isRandomTime =
    !watchedValues.item_get_time || watchedValues.item_get_time === "";

  if (!user) {
    return <NameInput />;
  }

  if (successData.id && successData.editId) {
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
                  value={`${window.location.origin}/${successData.id}/${successData.editId}`}
                  readOnly
                  className="flex-1 text-sm p-2 h-auto focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/${successData.id}/${successData.editId}`,
                      "link",
                    )
                  }
                  className="w-8 h-8 p-0 bg-primary hover:bg-green-700 text-white"
                >
                  {copiedStates.link ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4 text-white" />
                  )}
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
                    onClick={() =>
                      copyToClipboard(successData.password, "password")
                    }
                    className="w-8 h-8 p-0 bg-primary hover:bg-green-700 text-white"
                  >
                    {copiedStates.password ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button asChild>
            <Link
              to={"/$roomId/$editId"}
              params={{ roomId: successData.id, editId: successData.editId }}
            >
              編集へ
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="min-h-screen w-full max-w-2xl bg-white rounded-lg flex flex-col px-4 sm:px-8 md:px-16 lg:px-24 gap-6 justify-center py-6 sm:py-8 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent mx-auto"
      style={{ scrollbarGutter: "stable" }}
    >
      <h1 className="text-xl sm:text-2xl font-bold text-center">
        アドベントカレンダーを作ろう！
      </h1>

      {/* --- 期間選択 --- */}
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

      {/* --- アイテムゲット時間 --- */}
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
              className={`flex w-full flex-row sm:items-center justify-between p-3 rounded-lg transition-all gap-2 border-2 ${
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
              className={`flex w-full flex-row sm:items-center justify-between p-3 rounded-lg transition-all gap-2 border-2 ${
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

      {/* --- 編集用合言葉 --- */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-row sm:items-center justify-between gap-2 sm:gap-0">
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
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        )}
      </div>

      {/* --- 参加者名の公開設定 --- */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-0">
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

      {/* --- 持ち物のはじめの状態（複数選択可） --- */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Handbag className="text-primary" />
          <h2 className="text-base sm:text-lg font-semibold">
            持ち物のはじめの状態（複数選択可）
          </h2>
        </div>
        {isLoadingItems ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            読み込み中...
          </div>
        ) : (
          <>
            {/* クリスマス */}
            {groupedItems.christmas.length > 0 && (
              <div className="mx-2-">
                <button
                  type="button"
                  className="flex items-center gap-2 font-bold text-sm mb-1 focus:outline-none"
                  onClick={() => setOpenChristmas((v) => !v)}
                  aria-expanded={openChristmas}
                >
                  <span>クリスマス</span>
                  <span
                    className={
                      openChristmas
                        ? "rotate-90 transition-transform"
                        : "transition-transform"
                    }
                  >
                    ▷
                  </span>
                </button>
                {openChristmas && (
                  <div className="flex flex-wrap gap-3 mt-1">
                    {groupedItems.christmas.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 cursor-pointer select-none"
                        htmlFor={`item-${item.id}`}
                      >
                        <Checkbox
                          checked={watchedValues.default_item_ids.includes(
                            item.id,
                          )}
                          onCheckedChange={(checked) => {
                            const arr = watchedValues.default_item_ids || [];
                            if (checked) {
                              setValue("default_item_ids", [...arr, item.id]);
                            } else {
                              setValue(
                                "default_item_ids",
                                arr.filter((id) => id !== item.id),
                              );
                            }
                          }}
                          id={`item-${item.id}`}
                        />
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={watchedValues.default_item_ids.includes(
                            item.id,
                          )}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const arr = watchedValues.default_item_ids || [];
                            if (checked) {
                              setValue("default_item_ids", [...arr, item.id]);
                            } else {
                              setValue(
                                "default_item_ids",
                                arr.filter((id) => id !== item.id),
                              );
                            }
                          }}
                          className="hidden"
                        />
                        <span className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded overflow-hidden bg-muted border shrink-0">
                            <img
                              src={`${R2_BASE_URL}/item/thumbnail/${item.id}.png`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* オールシーズン */}
            {groupedItems.allSeason.length > 0 && (
              <div className="mb-2">
                <button
                  type="button"
                  className="flex items-center gap-2 font-bold text-sm mb-1 focus:outline-none"
                  onClick={() => setOpenAllSeason((v) => !v)}
                  aria-expanded={openAllSeason}
                >
                  <span>その他</span>
                  <span
                    className={
                      openAllSeason
                        ? "rotate-90 transition-transform"
                        : "transition-transform"
                    }
                  >
                    ▷
                  </span>
                </button>
                {openAllSeason && (
                  <div className="flex flex-wrap gap-3 mt-1">
                    {groupedItems.allSeason.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 cursor-pointer select-none"
                        htmlFor={`item-${item.id}`}
                      >
                        <Checkbox
                          checked={watchedValues.default_item_ids.includes(
                            item.id,
                          )}
                          onCheckedChange={(checked) => {
                            const arr = watchedValues.default_item_ids || [];
                            if (checked) {
                              setValue("default_item_ids", [...arr, item.id]);
                            } else {
                              setValue(
                                "default_item_ids",
                                arr.filter((id) => id !== item.id),
                              );
                            }
                          }}
                          id={`item-${item.id}`}
                        />
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={watchedValues.default_item_ids.includes(
                            item.id,
                          )}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const arr = watchedValues.default_item_ids || [];
                            if (checked) {
                              setValue("default_item_ids", [...arr, item.id]);
                            } else {
                              setValue(
                                "default_item_ids",
                                arr.filter((id) => id !== item.id),
                              );
                            }
                          }}
                          className="hidden"
                        />
                        <span className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded overflow-hidden bg-muted border shrink-0">
                            <img
                              src={`${R2_BASE_URL}/item/thumbnail/${item.id}.png`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {errors.default_item_ids && (
          <p className="text-sm text-red-500">
            {errors.default_item_ids.message}
          </p>
        )}
      </div>

      {/* --- 注意書き --- */}
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
  );
}
