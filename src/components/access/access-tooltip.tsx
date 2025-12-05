import { TAccessFilter, accessTooltips } from "./types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function AccessTooltip({
  access,
  children,
}: {
  access: TAccessFilter["access"];
  children: React.ReactNode;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-wrap">
        <span>{accessTooltips[access]}</span>
      </TooltipContent>
    </Tooltip>
  );
}
