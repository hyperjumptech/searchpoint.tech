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
        className,
      )}>
      {children}
    </h1>
  );
}

export function TypographyH2({ children, className }: Props) {
  return (
    <h2
      className={clsx(
        "scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0",
        className,
      )}>
      {children}
    </h2>
  );
}

export function TypographyP({ children, className }: Props) {
  return <p className={className}>{children}</p>;
}
