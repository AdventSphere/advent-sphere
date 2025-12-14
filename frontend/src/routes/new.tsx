import { createFileRoute } from '@tanstack/react-router'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { format } from "date-fns"
import { postRooms } from "../../../common/generate/room/room"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { CalendarIcon,Copy,CalendarDays,Gift,Lock,UsersRound,Info,Link } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// zodスキーマ定義
const formSchema = z.object({
  start_at: z.union([z.string().min(1, "開始日を選択してください"), z.date()]),
  item_get_time: z.union([z.string(), z.date()]).optional(),
  password: z.string(),
  is_anonymous: z.union([z.boolean(), z.literal("")]),
}).refine(
  (data) => {
    // start_atが空文字でないことを確認
    if (typeof data.start_at === 'string' && data.start_at === '') {
      return false;
    }
    return true;
  },
  {
    message: "開始日は必須です",
    path: ["start_at"]
  }
)

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute('/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [successData, setSuccessData] = useState({
    editUrl: "https://advent-calendar-app.com/edit/abc123xyz",
    password: "winter2025"
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_at: new Date(2025, 11, 1), // 2025年12月1日
      item_get_time: "",
      password: "",
      is_anonymous: true
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: FormData) => {
    try {
      console.log("送信データ:", data)

      // APIに送信するデータ形式に変換
      const apiData = {
        owner_id: "temp_user_id", // TODO: 実際のユーザーIDを取得
        start_at: data.start_at instanceof Date ? data.start_at.toISOString() : data.start_at,
        item_get_time: data.item_get_time === "" ? undefined :
          (data.item_get_time instanceof Date ? data.item_get_time.toISOString() : data.item_get_time),
        password: data.password || undefined,
        is_anonymous: data.is_anonymous as boolean
      }

      console.log("API送信データ:", apiData)

      // 実際のAPI呼び出し
      const response = await postRooms(apiData)

      setIsSuccess(true)
      setSuccessData({
        editUrl: `https://advent-sphere.com/edit/${response.edit_id}`,
        password: data.password || "<パスワードなし>"
      })
    } catch (error) {
      console.error("エラー:", error)
      if (error instanceof Error) {
        alert(`作成に失敗しました: ${error.message}`)
      } else {
        alert("作成に失敗しました")
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // 日付の表示用計算
  const displayDate = () => {
    if (typeof watchedValues.start_at === 'object' && watchedValues.start_at) {
      const startDate = watchedValues.start_at
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 24)
      return {
        from: startDate,
        to: endDate
      }
    }
    return null
  }

  // アイテム取得時間の計算
  const isRandomTime = !watchedValues.item_get_time || watchedValues.item_get_time === ""
  if (isSuccess) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[color:var(--secondary)] p-4">
        <div className="w-full max-w-md bg-white rounded-lg flex flex-col px-4 py-8 gap-6 text-center">
          <h1 className="w-full text-lg sm:text-xl font-bold mb-4">アドベントカレンダーが作成されました！</h1>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link className="text-[color:var(--primary)]"/>
                <span className="text-sm font-semibold">編集リンク</span>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <input
                  type="text"
                  value={successData.editUrl}
                  readOnly
                  className="flex-1 text-sm bg-transparent outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(successData.editUrl)}
                  className="w-8 h-8 p-0 bg-[color:var(--primary)]  hover:bg-green-700 text-white"
                >
                  <Copy className="w-4 h-4  text-white" />
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="text-[color:var(--primary)]"/>
                <span className="text-sm font-semibold">編集用合言葉</span>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <input
                  type="text"
                  value={successData.password}
                  readOnly
                  className="flex-1 text-sm bg-transparent outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(successData.password)}
                  className="w-8 h-8 p-0 bg-[color:var(--primary)]  hover:bg-green-700 text-white"
                >
                  <Copy className="w-4 h-4  text-white" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-[color:var(--primary)] hover:bg-green-700 text-white"
            onClick={() => window.open(successData.editUrl, '_blank')}
          >
            編集へ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-[color:var(--secondary)] p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl bg-white rounded-lg flex flex-col px-4 sm:px-8 md:px-16 lg:px-24 gap-4 sm:gap-6 justify-center py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-center">アドベントカレンダーを作ろう！</h1>
        <div>
          <div className="flex gap-2 items-center">
            <CalendarDays className="text-[color:var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold">期間（25日間固定）</h2>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full sm:w-[380px] justify-start text-left font-normal mt-2",
                  !displayDate() && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {displayDate() ? (
                  <>
                    {format(displayDate()!.from, "yyyy/MM/dd")} ～{" "}
                    {format(displayDate()!.to, "yyyy/MM/dd")}
                  </>
                ) : (
                  <span>期間を選択</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                defaultMonth={typeof watchedValues.start_at === 'object' ? watchedValues.start_at : undefined}
                selected={typeof watchedValues.start_at === 'object' ? watchedValues.start_at : undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setValue("start_at", selectedDate)
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {errors.start_at && (
            <p className="text-sm text-red-500 mt-1">{errors.start_at.message}</p>
          )}
        </div>
        <div>
          <div className="flex gap-2 items-center mb-3">
            <Gift className="text-[color:var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold">アイテムゲット時間</h2>
          </div>
          <RadioGroup
            value={isRandomTime ? "random" : "specialized"}
            onValueChange={(value) => {
              if (value === "random") {
                setValue("item_get_time", "")
              } else {
                setValue("item_get_time", new Date(`2024-01-01T10:30:00`))
              }
            }}
            className="space-y-2"
          >
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all ${
              isRandomTime
                ? "border-2 border-[color:var(--primary)] bg-[color:#F0FBF3]"
                : "bg-[color:var(--muted)]"
            }`}>
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <RadioGroupItem value="random" id="random" />
                <div>
                  <Label htmlFor="random">ランダム</Label>
                  <div className="text-sm text-muted-foreground">毎日違う時間にサプライズ</div>
                </div>
              </div>
              <div className="bg-[color:var(--primary)] rounded text-white px-2 py-1 text-xs sm:text-sm self-start">おすすめ</div>
            </div>
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all ${
              !isRandomTime
                ? "border-2 border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                : "bg-[color:var(--muted)]"
            }`}>
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <RadioGroupItem value="specialized" id="specialized" />
                <div>
                  <Label htmlFor="specialized">指定した時間</Label>
                  <div className="text-sm text-muted-foreground">毎日同じ時間にお届け</div>
                </div>
              </div>
              <Input
                type="time"
                id="time-picker"
                defaultValue="10:30"
                onChange={(e) => {
                  if (!isRandomTime && e.target.value) {
                    const timeDate = new Date(`2024-01-01T${e.target.value}:00`)
                    setValue("item_get_time", timeDate)
                  }
                }}
                className="w-20 text-center font-mono bg-white self-start"
                disabled={isRandomTime}
              />
            </div>
          </RadioGroup>
        </div>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex gap-2 items-center">
              <Lock className="text-[color:var(--primary)]" />
              <h2 className="text-base sm:text-lg font-semibold">編集用合言葉を使う</h2>
            </div>
            <Switch
              id="use-passphrase"
              checked={watchedValues.password !== ""}
              onCheckedChange={(checked) => {
                setValue("password", checked ? "password" : "")
              }}
            />
          </div>
          {watchedValues.password !== "" && (
            <>
              <Input
                type="text"
                placeholder="合言葉を入力してください"
                {...register("password")}
                className="w-full sm:w-[300px] mt-2"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex gap-2 items-center">
            <UsersRound className="text-[color:var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold">参加者の名前を公開する</h2>
          </div>
          <Switch
            id="show-participant-names"
            checked={!!watchedValues.is_anonymous}
            onCheckedChange={(checked) => {
              setValue("is_anonymous", checked)
            }}
          />
        </div>
        <div className="flex gap-2 bg-[color:#FDFBE0] p-3 sm:p-4 rounded-lg">
          <Info className="text-[color:#854D0E] flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[color:#854D0E]">このカレンダーは期間終了後90日でデータが削除されます</p>
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-full sm:w-36"
            disabled={isSubmitting}
          >
            {isSubmitting ? "作成中..." : "登録"}
          </Button>
        </div>
      </form>
    </div>
  )
}
