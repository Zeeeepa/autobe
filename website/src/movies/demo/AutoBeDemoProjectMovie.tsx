"use client";

import { AutoBeDemoStorage } from "@/src/data/AutoBeDemoStorage";
import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { useEffect, useRef, useState } from "react";

export default function AutoBeDemoProjectMovie(
  props: AutoBeDemoProjectMovie.IProps,
) {
  // Use project name directly from replay data
  const replay: IAutoBePlaygroundReplay.ISummary | null =
    AutoBeDemoStorage.getProject(props);
  
  if (replay === null) {
    return (
      <div className="block bg-white/5 border border-gray-600/30 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-gray-400">No project data available</p>
      </div>
    );
  }

  const projectTitle =
    replay.project.charAt(0).toUpperCase() + replay.project.slice(1);

  // Generate URL based on vendor and project
  const vendor = replay.vendor.replace(/\//g, "-");
  const url = `https://github.com/wrtnlabs/autobe-example-${replay.project}-${vendor}`;

  const tokenUsage = replay.tokenUsage.aggregate;
  const totalTokens = formatTokens(tokenUsage.total);
  const inputTokens = formatTokens(tokenUsage.input.total);
  const cachedTokens = formatTokens(tokenUsage.input.cached);
  const outputTokens = formatTokens(tokenUsage.output.total);

  // Detect container width to show/hide time column
  const containerRef = useRef<HTMLAnchorElement>(null);
  const [showTimeColumn, setShowTimeColumn] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        // Show time column only if container is wider than 400px
        setShowTimeColumn(containerRef.current.offsetWidth > 400);
      }
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);

    // Use ResizeObserver for more accurate detection
    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkWidth);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <a
      ref={containerRef}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white/5 border border-gray-600/30 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-gray-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.02]"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold">{projectTitle}</h3>
        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-xs text-gray-400 bg-gray-700/30 group-hover:bg-gray-600/40 px-3 py-1.5 rounded-lg transition-all">
            {replay.vendor}
          </span>
          <svg
            className="w-4 h-4 text-white/60 group-hover:text-white group-hover:scale-110 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      <div className="mb-6">
        <table className="w-full">
          <tbody>
            {(
              ["analyze", "prisma", "interface", "test", "realize"] as const
            ).map((phaseName) => {
              const phase = replay[phaseName];
              if (!phase) {
                return (
                  <tr
                    key={phaseName}
                    className="border-b border-gray-700/30 last:border-0"
                  >
                    <td className="py-2 pr-3 w-6">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                    </td>
                    <td className="py-2 pr-1 text-sm">
                      <span className="text-gray-500">
                        {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 pl-1 text-sm text-gray-500 whitespace-nowrap">
                      -
                    </td>
                    {showTimeColumn && (
                      <td className="py-2 px-3 text-sm text-gray-500 text-right w-20 whitespace-nowrap">
                        -
                      </td>
                    )}
                  </tr>
                );
              }

              const detail = phase.aggregate
                ? Object.entries(phase.aggregate)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")
                : "-";

              return (
                <tr
                  key={phaseName}
                  className="border-b border-gray-700/30 last:border-0"
                >
                  <td className="py-2 pr-3 w-6">
                    <div
                      className={`w-3 h-3 ${
                        phase.success === true
                          ? "bg-green-500"
                          : phase.success === false
                            ? "bg-red-500"
                            : "bg-gray-600"
                      } rounded-full`}
                    ></div>
                  </td>
                  <td className="py-2 pr-3 text-sm w-20">
                    <span
                      className={
                        phase.success === true
                          ? "text-white"
                          : phase.success === false
                            ? "text-red-400"
                            : "text-gray-500"
                      }
                    >
                      {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 pl-1 text-sm text-gray-400 whitespace-nowrap">
                    {detail}
                  </td>
                  {showTimeColumn && (
                    <td className="py-2 px-3 text-sm text-gray-400 text-right w-20 whitespace-nowrap">
                      {phase.elapsed ? formatElapsedTime(phase.elapsed) : "-"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm text-gray-400">
            <span className="mr-2">⏱</span>
            <span>Elapsed Time</span>
          </div>
          <span className="text-blue-400 font-bold">
            {formatElapsedTime(replay.elapsed)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <span className="mr-2">🧠</span>
            <span>Total Tokens</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-white">{totalTokens}</div>
            <div className="text-xs text-gray-400">
              <div>
                in: {inputTokens} ({cachedTokens} cached)
              </div>
              <div>out: {outputTokens}</div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
export namespace AutoBeDemoProjectMovie {
  export interface IProps {
    model: string;
    project: string;
  }
}

// Convert elapsed time from milliseconds to human readable format
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;
  const h = hours;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

// Format token numbers with K/M suffix
function formatTokens(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
