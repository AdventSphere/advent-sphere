import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <main className="w-full min-h-svh">
      <h1>Hello World</h1>
    </main>
  );
}
