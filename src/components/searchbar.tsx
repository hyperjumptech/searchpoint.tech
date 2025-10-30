"use client";

import clsx from "clsx";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";

import { Input } from "@/components/ui/input";

type Props = {
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
};

export default function SearchBar({
  defaultValue,
  className,
  inputClassName,
}: Props) {
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString().trim();

    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx("w-full", className)}>
      <Input
        name="q"
        defaultValue={defaultValue}
        placeholder="Ask me anything about your business data..."
        leftIcon={<SearchIcon className="w-5 h-5 mr-1" />}
        className={clsx("w-full py-2 px-4 rounded-full", inputClassName)}
      />
    </form>
  );
}
