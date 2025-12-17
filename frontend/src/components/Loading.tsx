import { Spinner } from "./ui/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full grow">
      <div className="flex items-center gap-4 text-base md:text-lg lg:text-2xl font-bold text-primary">
        <Spinner className="size-6" />
        部屋を読み込み中...
      </div>
    </div>
  );
}
