"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

type Props = {
  autoFocus?: boolean;
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
};

export default function SearchBar({
  autoFocus,
  defaultValue,
  className,
  inputClassName,
}: Props) {
  const router = useRouter();

  return (
    <form
      className={clsx("w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = e.currentTarget.q.value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}>
      <Input
        name="q"
        autoFocus={autoFocus}
        defaultValue={defaultValue}
        placeholder="Ask me anything about your business data..."
        leftIcon={<SearchIcon className="w-5 h-5 mr-1" />}
        className={clsx("w-full py-2 px-4 rounded-full", inputClassName)}
      />
    </form>
  );
}
