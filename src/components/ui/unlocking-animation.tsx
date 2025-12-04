"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type UnlockingAnimationProps = {
  className?: string;
};

export function UnlockingAnimation({ className }: UnlockingAnimationProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={className}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.1"
          fill="none"
        />

        {/* Animated circular progress */}
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          stroke={isComplete ? "#22c55e" : "currentColor"}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="176"
          initial={{ strokeDashoffset: 176 }}
          animate={{ strokeDashoffset: isComplete ? 0 : 0 }}
          transition={{
            duration: 2,
            ease: "linear",
          }}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "32px 32px",
          }}
        />

        {/* Padlock icon in center */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{ duration: 0.3 }}>
          {/* Shackle */}
          <motion.path
            d="M 26 28 L 26 22 C 26 18.7 28.7 16 32 16 C 35.3 16 38 18.7 38 22 L 38 28"
            stroke={isComplete ? "#22c55e" : "currentColor"}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            animate={{
              stroke: isComplete ? "#22c55e" : "currentColor",
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Lock Body */}
          <motion.rect
            x="24"
            y="28"
            width="16"
            height="12"
            rx="2"
            stroke={isComplete ? "#22c55e" : "currentColor"}
            strokeWidth="2.5"
            fill="none"
            animate={{
              stroke: isComplete ? "#22c55e" : "currentColor",
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Keyhole */}
          <motion.circle
            cx="32"
            cy="33"
            r="1.5"
            fill={isComplete ? "#22c55e" : "currentColor"}
            animate={{
              fill: isComplete ? "#22c55e" : "currentColor",
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.rect
            x="31"
            y="33"
            width="2"
            height="3"
            fill={isComplete ? "#22c55e" : "currentColor"}
            animate={{
              fill: isComplete ? "#22c55e" : "currentColor",
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.g>

        {/* Pulsing effect when complete */}
        {isComplete && (
          <motion.circle
            cx="32"
            cy="32"
            r="30"
            stroke="#22c55e"
            strokeWidth="1"
            fill="none"
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </svg>
    </div>
  );
}
