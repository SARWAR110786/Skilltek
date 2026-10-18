import {
  Bot,
  Braces,
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Terminal,
} from "lucide-react";

const TECHS = [
  {
    Icon: BrainCircuit,
    label: "Artificial Intelligence",
    grad: "from-fuchsia-500 to-indigo-600",
    delay: "0s",
    dur: "7s",
  },
  {
    Icon: Cpu,
    label: "Computer Hardware",
    grad: "from-sky-500 to-blue-600",
    delay: "0.9s",
    dur: "6.2s",
  },
  {
    Icon: Code2,
    label: "Software Development",
    grad: "from-emerald-500 to-teal-600",
    delay: "1.7s",
    dur: "8s",
  },
  {
    Icon: Terminal,
    label: "Command Line",
    grad: "from-amber-500 to-orange-600",
    delay: "0.4s",
    dur: "6.8s",
  },
  {
    Icon: Database,
    label: "Databases",
    grad: "from-rose-500 to-pink-600",
    delay: "1.3s",
    dur: "7.4s",
  },
  {
    Icon: Cloud,
    label: "Cloud Computing",
    grad: "from-violet-500 to-purple-600",
    delay: "2.1s",
    dur: "6.5s",
  },
  {
    Icon: Bot,
    label: "Automation & Bots",
    grad: "from-cyan-500 to-sky-600",
    delay: "0.6s",
    dur: "8.2s",
  },
  {
    Icon: GitBranch,
    label: "DevOps",
    grad: "from-lime-500 to-green-600",
    delay: "1.5s",
    dur: "7.2s",
  },
  {
    Icon: Braces,
    label: "Programming",
    grad: "from-indigo-500 to-blue-700",
    delay: "0.2s",
    dur: "6.4s",
  },
];

export function TechIcons() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-64 w-64 animate-pulse-glow rounded-full bg-brand-600/30 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[22rem] w-[22rem] animate-spin-slow rounded-full border border-dashed border-white/10" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 animate-spin-slow-reverse rounded-full border border-white/5" />
      </div>

      <div className="relative grid grid-cols-3 gap-4 sm:gap-5">
        {TECHS.map(({ Icon, label, grad, delay, dur }) => (
          <div
            key={label}
            className="float-tile"
            style={{ animationDelay: delay, animationDuration: dur }}
          >
            <div
              title={label}
              className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_35px_-15px_rgba(15,23,42,0.85)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.06]"
            >
              <span
                className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-20 transition-opacity duration-300 group-hover:opacity-35`}
              />
              <span
                className={`absolute -inset-6 bg-gradient-to-br ${grad} opacity-20 blur-2xl`}
              />
              <Icon
                className="relative h-7 w-7 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)] sm:h-8 sm:w-8"
                strokeWidth={1.7}
              />
              <span className="pointer-events-none absolute inset-x-2 top-1.5 h-1/3 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
