"use client";

import { Button } from "@/components/ui/button";
import { useCounterStore } from "@/stores/counter";

export function Counter() {
  const { count, increment } = useCounterStore();

  return (
    <>
      <h1 className="text-6xl font-bold">{count}</h1>
      <Button onClick={increment}>Increment</Button>
    </>
  );
}
