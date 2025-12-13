import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react"
import { CalendarIcon, Copy } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { CalendarDays,Gift,Lock,UsersRound,Info,Link } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export const Route = createFileRoute('/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 11, 1), // 2025年12月1日
    to: new Date(2025, 11, 25),   // 2025年12月25日
  })
  const [usePassphrase, setUsePassphrase] = useState(false)
  const [passphrase, setPassphrase] = useState("")
  const [itemTime, setItemTime] = useState("random")
  const [isSuccess, setIsSuccess] = useState(false)

  // 成功時のサンプルデータ
  const [successData, setSuccessData] = useState({
    editUrl: "https://advent-calendar-app.com/edit/abc123xyz",
    password: "winter2025"
  })

  const handleSubmit = async () => {
    // ここで実際のAPI呼び出しを行う
    // 一時的に成功を模擬
    setTimeout(() => {
      setIsSuccess(true)
      setSuccessData({
        editUrl: "https://advent-calendar-app.com/edit/" + Math.random().toString(36).substring(7),
        password: passphrase || "winter2025"
      })
    }, 1000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 必要に応じてトーストメッセージを表示
  }

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
            onClick={() => window.location.href = '/'}
          >
            編集へ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-[color:var(--secondary)] p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg flex flex-col px-4 sm:px-8 md:px-16 lg:px-24 gap-4 sm:gap-6 justify-center py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-center">アドベントカレンダーを作ろう！</h1>
        <div>
          <div className="flex gap-2 items-center">
            <CalendarDays className="text-[color:var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold">期間（25日間固定）</h2>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[380px] justify-start text-left font-normal mt-2",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "yyyy/MM/dd")} ～{" "}
                      {format(date.to, "yyyy/MM/dd")}
                    </>
                  ) : (
                    format(date.from, "yyyy/MM/dd")
                  )
                ) : (
                  <span>期間を選択</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <div className="flex gap-2 items-center mb-3">
            <Gift className="text-[color:var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold">アイテムゲット時間</h2>
          </div>
          <RadioGroup value={itemTime} onValueChange={setItemTime} className="space-y-2">
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all ${
              itemTime === "random"
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
              itemTime === "specilazed"
                ? "border-2 border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                : "bg-[color:var(--muted)]"
            }`}>
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <RadioGroupItem value="specilazed" id="specilazed" />
                <div>
                  <Label htmlFor="specilazed">指定した時間</Label>
                  <div className="text-sm text-muted-foreground">毎日同じ時間にお届け</div>
                </div>
              </div>
              <Input
                type="time"
                id="time-picker"
                defaultValue="10:30"
                className="w-20 text-center font-mono bg-white self-start"
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
              checked={usePassphrase}
              onCheckedChange={setUsePassphrase}
            />
          </div>
          {usePassphrase && (
            <Input
              type="text"
              placeholder="合言葉を入力してください"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full sm:w-[300px] mt-2"
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex gap-2 items-center">
            <UsersRound className="text-[color:var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold">参加者の名前を公開する</h2>
          </div>
          <Switch id="show-participant-names" />
        </div>
        <div className="flex gap-2 bg-[color:#FDFBE0] p-3 sm:p-4 rounded-lg">
          <Info className="text-[color:#854D0E] flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[color:#854D0E]">このカレンダーは期間終了後90日でデータが削除されます</p>
        </div>
        <div className="flex justify-center">
          <Button
            className="w-full sm:w-36"
            onClick={handleSubmit}
          >
            登録
          </Button>
        </div>
      </div>
    </div>
  )
}
