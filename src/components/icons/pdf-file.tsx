import { LucideProps } from "lucide-react";
import * as React from "react";

const PDFFileIcon = React.forwardRef<SVGSVGElement, LucideProps>(
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
        <path
          fill="#D9D9D9"
          fillRule="evenodd"
          d="M3.34 6c.43 0 .805.374.806.803v.537c0 .43-.377.806-.806.806h-.535v1.071H2V6zm-.535.803v.537h.535v-.537zM6.023 6c.429 0 .805.374.805.803v1.609c0 .43-.376.805-.805.805h-1.34V6zm-.537.803v1.609h.537V6.803z"
          clipRule="evenodd"></path>
        <path
          fill="#D9D9D9"
          d="M8.974 6.803h-.806v.537h.806v.806h-.806v1.071h-.803V6h1.609z"></path>
      </svg>
    );
  },
);

PDFFileIcon.displayName = "PDFFileIcon";

export default PDFFileIcon;
