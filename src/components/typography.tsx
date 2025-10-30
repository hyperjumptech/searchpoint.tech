import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function TypographyH1({ children, className }: Props) {
  return (
    <h1
      className={clsx(
        "scroll-m-20 text-center text-3xl font-extrabold tracking-tight text-balance",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function TypographyP({ children, className }: Props) {
  return (
    <p className={clsx("leading-7 not-first:mt-6", className)}>{children}</p>
  );
}
