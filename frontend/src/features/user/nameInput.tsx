import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";

export default function NameInput() {
  const { createUser } = useUser();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    await createUser(name);
  };

  return (
    <div className="bg-muted flex items-center justify-center grow w-full">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 w-full max-w-md mx-auto p-6"
      >
        <h1 className="text-xl font-bold text-center pb-3">
          名前を入力してください
        </h1>
        <Input
          type="text"
          placeholder="名前を入力してください"
          className="w-full p-3 h-fit rounded-xl bg-background text-base"
          name="name"
          required
        />
        <Button
          type="submit"
          size={"lg"}
          className="w-full rounded-xl font-bold"
        >
          保存
        </Button>
      </form>
    </div>
  );
}
