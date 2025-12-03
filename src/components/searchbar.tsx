"use client";

import clsx from "clsx";
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
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = e.currentTarget.q.value.trim();

    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  }

  return (
    <form className={clsx("w-full", className)} onSubmit={handleSubmit}>
      <Input
        name="q"
        type="search"
        autoFocus={autoFocus}
        defaultValue={defaultValue}
        placeholder="Search from Sharepoint and Shared Folders..."
        leftIcon={<SearchIcon className="w-5 h-5 mr-1" />}
        className={clsx("w-full py-2 px-4 rounded-full", inputClassName)}
      />
    </form>
  );
}
