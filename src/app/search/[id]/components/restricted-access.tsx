import BackButton from "./back-button";
import Image from "next/image";

export function RestrictedAccess() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 md:px-16 py-12">
      <BackButton />
      <div className="flex flex-col items-start py-8 xl:py-32">
        <div className="flex h-14 w-14 mb-8 items-center justify-center rounded-full bg-[#CB3635]">
          <Image
            src="/icons/forbidden.svg"
            alt="Forbidden Icons"
            width={28}
            height={28}
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-[32px] max-w-md font-bold leading-tight text-[#CB3635]">
            You don&apos;t have permission to access this file
          </h1>
          <p className="text-xl leading-relaxed text-muted-foreground">
            If you think you meet the criteria to open this file, please contact{" "}
            <a
              href="mailto:ferdi@hyperjump.tech"
              className="font-semibold cursor-pointer text-primary underline-offset-2 hover:underline">
              our admin
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
