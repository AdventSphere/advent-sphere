import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <main className="w-full min-h-svh flex items-center bg-secondary text-primary">
      <div className="w-full flex flex-col justify-center items-center">
        <h1 className="text-4xl font-extrabold">Advent Sphere</h1>
        <h3 className="mt-2">アドベントスフィア</h3>
        <Button className="mt-8">
          <Link to="/new">新しい部屋を作る</Link>
        </Button>
      </div>
    </main>
  );
}
