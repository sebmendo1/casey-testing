"use client";

import Image from "next/image";
import LaunchPromptCard from "./LaunchPromptCard";
import SparkleIcon from "./SparkleIcon";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const PROMPTS = [
  {
    text: "Apply for a home loan",
    icon: <Image src="/assets/Icon-2.svg" alt="" width={20} height={20} />,
  },
  {
    text: "See how much I can qualify for",
    icon: <Image src="/assets/Icon-1.svg" alt="" width={20} height={20} />,
  },
  {
    text: "Search for homes in my area",
    icon: <Image src="/assets/Icon.svg" alt="" width={20} height={20} />,
  },
] as const;

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-start px-6 pt-2">
      <div
        className="mb-4 opacity-0 animate-fade-in"
        style={{ color: "var(--text-primary)", animationDelay: "100ms" }}
      >
        <SparkleIcon size={28} />
      </div>
      <h1
        className="mb-8 max-w-[min(100%,22rem)] text-left text-[26px] font-bold leading-tight opacity-0 animate-fade-in"
        style={{ color: "var(--text-primary)", animationDelay: "200ms" }}
      >
        I&apos;m Casey, your digital home lending assistant
      </h1>
      <div className="flex flex-col items-start gap-3">
        {PROMPTS.map(({ text, icon }, i) => (
          <LaunchPromptCard
            key={text}
            icon={icon}
            text={text}
            onClick={() => onSuggestionClick(text)}
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: `${300 + i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
