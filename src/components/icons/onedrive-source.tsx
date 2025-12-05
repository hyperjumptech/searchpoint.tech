import { LucideProps } from "lucide-react";
import * as React from "react";

const OnedriveSourceIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill="none"
        viewBox="0 0 14 10"
        {...props}>
        <path
          fill="currentColor"
          opacity="0.4"
          d="M10.7 2.17c.285.509.26 1.388.69 1.761.623.062 1.927.466 2.163 1.591.296 1.407.147 3.569-2.163 3.505-1.898 0-7.2-.14-9.613-.209-2.124-.954-2.32-3.923-.718-5.393.367-.337.83-.6 1.32-.742.244-.07.67-.042.861-.207.283-.241.396-.748.634-1.045C4.501.648 5.486.118 6.524.021 8.264-.145 9.88.708 10.7 2.17"></path>
        <path
          fill="currentColor"
          opacity="0.6"
          d="M7.545 5.138C5.427 6.195 3.266 7.381 1.056 8.251c-.113.045-.223-.08-.263-.15-1.15-1.287-1.038-3.478.266-4.675.367-.337.83-.6 1.32-.742.244-.07.67-.042.861-.207.283-.241.396-.748.634-1.045C4.501.65 5.486.12 6.524.022 8.264-.144 9.88.71 10.7 2.17c.285.509.26 1.388.69 1.761-1.45-.173-2.603.586-3.845 1.206"></path>
      </svg>
    );
  },
);

OnedriveSourceIcon.displayName = "OnedriveSourceIcon";

export default OnedriveSourceIcon;
