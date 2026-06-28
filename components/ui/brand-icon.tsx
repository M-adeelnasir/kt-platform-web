import type { ComponentType } from "react";
import {
  SiAsana,
  SiAtlassian,
  SiBitbucket,
  SiClickup,
  SiConfluence,
  SiDiscord,
  SiGithub,
  SiGitlab,
  SiGoogle,
  SiHubspot,
  SiJira,
  SiLinear,
  SiNotion,
  SiTrello,
  SiZoom,
} from "react-icons/si";
import { FaMicrosoft, FaSalesforce, FaSlack } from "react-icons/fa6";
import { Briefcase, Infinity as InfinityIcon, LayoutGrid, MessagesSquare, Plug, Sprout } from "lucide-react";
import { cn } from "@/lib/cn";

type IconCmp = ComponentType<{ size?: number; color?: string; className?: string }>;

// Brand mark + official-ish color per connector/platform. Simple Icons where available,
// Font Awesome for brands Simple Icons delisted (Microsoft/Slack/Salesforce), lucide fallbacks.
const BRANDS: Record<string, { Icon: IconCmp; color: string }> = {
  google: { Icon: SiGoogle, color: "#4285F4" },
  github: { Icon: SiGithub, color: "#181717" },
  atlassian: { Icon: SiAtlassian, color: "#0052CC" },
  microsoft: { Icon: FaMicrosoft, color: "#0078D4" },
  jira: { Icon: SiJira, color: "#0052CC" },
  confluence: { Icon: SiConfluence, color: "#172B4D" },
  slack: { Icon: FaSlack, color: "#4A154B" },
  discord: { Icon: SiDiscord, color: "#5865F2" },
  teams: { Icon: MessagesSquare, color: "#6264A7" },
  notion: { Icon: SiNotion, color: "#000000" },
  asana: { Icon: SiAsana, color: "#F06A6A" },
  trello: { Icon: SiTrello, color: "#0052CC" },
  monday: { Icon: LayoutGrid, color: "#FF3D57" },
  linear: { Icon: SiLinear, color: "#5E6AD2" },
  clickup: { Icon: SiClickup, color: "#7B68EE" },
  zoom: { Icon: SiZoom, color: "#0B5CFF" },
  salesforce: { Icon: FaSalesforce, color: "#00A1E0" },
  hubspot: { Icon: SiHubspot, color: "#FF7A59" },
  gitlab: { Icon: SiGitlab, color: "#FC6D26" },
  bitbucket: { Icon: SiBitbucket, color: "#0052CC" },
  azuredevops: { Icon: InfinityIcon, color: "#0078D7" },
  bamboohr: { Icon: Sprout, color: "#6DB33F" },
  workday: { Icon: Briefcase, color: "#0875E1" },
};

/** A brand logo on a clean white tile (legible in light + dark). */
export function BrandIcon({
  type,
  size = 40,
  icon = 20,
  className,
}: {
  type: string;
  size?: number;
  icon?: number;
  className?: string;
}) {
  const brand = BRANDS[type] ?? { Icon: Plug, color: "#76766f" };
  const Icon = brand.Icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] bg-white ring-1 ring-black/[0.06]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={icon} color={brand.color} />
    </span>
  );
}

export function hasBrand(type: string): boolean {
  return type in BRANDS;
}
