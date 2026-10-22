import localFont from "next/font/local";
import "@/components/landing/landing.css";

const manrope = localFont({
  src: "./fonts/Manrope-Variable.woff2",
  variable: "--font-landing-primary",
  display: "swap",
  weight: "200 800",
  style: "normal",
  fallback: ["system-ui", "sans-serif"],
});

const ibmPlexSerif = localFont({
  src: [
    {
      path: "./fonts/IBM-Plex-Serif-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/IBM-Plex-Serif-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-landing-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${manrope.variable} ${ibmPlexSerif.variable} min-h-screen w-full`}>
      {children}
    </div>
  );
}
