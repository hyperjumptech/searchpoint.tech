import { LucideProps } from "lucide-react";
import * as React from "react";

const OtherSourceIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill="none"
        viewBox="0 0 10 11"
        {...props}>
        <path
          fill="currentColor"
          opacity="0.4"
          d="M0 1.017C0 .455.455 0 1.017 0h7.438c.451 0 .952.187.636.509l-8.675 8.8C.096 9.634 0 9.037 0 8.583z"></path>
        <path
          fill="currentColor"
          opacity="0.6"
          d="M8.9 0c.562 0 1.017.455 1.017 1.017v8.01c0 .562-.455 1.017-1.017 1.017H1.018A1.017 1.017 0 0 1 0 9.027v-.22c0 .455.18 1.051.5.729l5.606-5.658L9.424.508C9.74.188 9.155 0 8.704 0z"></path>
        <circle cx="2.035" cy="5.086" r="1.017" fill="#D9D9D9"></circle>
        <circle cx="4.959" cy="5.086" r="1.017" fill="#F1F1F1"></circle>
        <circle cx="7.883" cy="5.086" r="1.017" fill="#D9D9D9"></circle>
      </svg>
    );
  },
);

OtherSourceIcon.displayName = "OtherSourceIcon";

export default OtherSourceIcon;
