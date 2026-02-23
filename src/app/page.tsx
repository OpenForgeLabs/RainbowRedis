import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Redis Plugin</h1>
      <p className="text-sm text-muted-foreground">
        This plugin serves the Redis explorer. Open a connection to begin.
      </p>
      <div className="text-sm text-muted-foreground">
        Open a connection from the BlueExplorer shell to launch the explorer.
      </div>
    </div>
  );
}
