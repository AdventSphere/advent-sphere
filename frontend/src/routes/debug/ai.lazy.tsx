import { createLazyFileRoute } from "@tanstack/react-router";
import AiGenerationScreen from "@/features/edit/AiGenerationScreen";

export const Route = createLazyFileRoute("/debug/ai")({
  component: RouteComponent,
});

function RouteComponent() {
  // Hardcoded dummy ID for debug purposes
  const DEBUG_ROOM_ID = "debug-room-id";

  return (
    <div className="w-full min-h-screen">
      <AiGenerationScreen
        roomId={DEBUG_ROOM_ID}
        onBack={() => {
          console.log("Back clicked");
          window.history.back();
        }}
      />
    </div>
  );
}
