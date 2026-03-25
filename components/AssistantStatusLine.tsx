"use client";

import SparkleIcon from "./SparkleIcon";

export default function AssistantStatusLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <SparkleIcon size={18} />
      <p className="min-h-[20px] text-[15px] font-semibold leading-tight text-[#002855]">
        {text}
      </p>
    </div>
  );
}
