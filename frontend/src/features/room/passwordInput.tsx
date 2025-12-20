import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface PasswordInputProps {
  onSubmit: (password: string) => Promise<void>;
  isLoading: boolean;
}

export default function PasswordInput({
  onSubmit,
  isLoading,
}: PasswordInputProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get("password") as string;
    await onSubmit(password);
  };

  return (
    <div className="bg-muted flex items-center justify-center grow w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 w-full max-w-md mx-auto p-6"
      >
        <Key className="text-gray-600 w-10 h-10  mx-auto" />
        <h1 className="text-black text-xl font-bold text-center pb-3">
          編集には合言葉が必要です
        </h1>
        <Input
          type="text"
          placeholder="編集用合言葉"
          className="w-full p-3 h-fit rounded-xl bg-background text-base"
          name="password"
          required
        />
        <Button
          type="submit"
          size={"lg"}
          className="w-full rounded-xl font-bold bg-primary hover:bg-primary-dark text-white"
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="size-4" /> : "続行"}
        </Button>
      </form>
    </div>
  );
}
