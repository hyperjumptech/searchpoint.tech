import { LucideProps } from "lucide-react";
import * as React from "react";

const DOCXFileIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill="none"
        viewBox="0 0 11 14"
        {...props}>
        <path
          fill="currentColor"
          opacity="0.6"
          d="M0 1a1 1 0 0 1 1-1h7l3 3v10a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1z"></path>
        <path fill="#D9D9D9" d="m8 0 3 3H8z"></path>
        <path stroke="#D9D9D9" d="M2 6h7M2 8h7M2 10h7"></path>
      </svg>
    );
  },
);

DOCXFileIcon.displayName = "DOCXFileIcon";

export default DOCXFileIcon;
