import { createLazyFileRoute } from "@tanstack/react-router";
import { useUser } from "@/context/UserContext";
import NameInput from "@/features/user/nameInput";

export const Route = createLazyFileRoute("/$roomId/$editId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { roomId, editId } = Route.useParams();
  console.log(roomId, editId);
  const { user } = useUser();

  if (!user) {
    return <NameInput />;
  }
  return (
    <div className="w-full h-svh flex">
      <div className="w-full p-3 md:p-6 lg:p-8 grow h-full grid grid-cols-2">
        <div className="col-span-2">
          <h1 className="text-2xl font-bold">部屋編集</h1>
        </div>
      </div>
    </div>
  );
}
