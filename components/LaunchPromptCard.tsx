"use client";

import type { ReactNode } from "react";

const TEXT_COLOR = "#002855";
const ICON_BG = "#00285514";

interface LaunchPromptCardProps {
  icon: ReactNode;
  text: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function LaunchPromptCard({
  icon,
  text,
  onClick,
  className = "",
  style,
}: LaunchPromptCardProps) {
  const content = (
    <>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full [&>img]:h-5 [&>img]:w-5 [&>img]:opacity-90 [&>img]:saturate-0 [&>svg]:h-5 [&>svg]:w-5 [&_path]:fill-[#002855] [&_path]:stroke-[#002855]"
        style={{ backgroundColor: ICON_BG }}
      >
        {icon}
      </div>
      <span className="text-base font-medium leading-snug" style={{ color: TEXT_COLOR }}>
        {text}
      </span>
    </>
  );

  const baseClasses =
    "flex flex-row items-center gap-3 rounded-full bg-white pl-2 pr-5 min-h-[52px] w-fit transition-transform active:scale-[0.98]";
  const shadowStyle = { boxShadow: "0 6px 18px rgba(0, 40, 85, 0.07), 0 1px 4px rgba(0, 40, 85, 0.04)" };

  const combinedClassName = `${baseClasses} ${className}`.trim();

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={combinedClassName}
        style={{ ...shadowStyle, ...style }}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={combinedClassName} style={{ ...shadowStyle, ...style }}>
      {content}
    </div>
  );
}
