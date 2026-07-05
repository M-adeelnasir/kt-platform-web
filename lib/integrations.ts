/**
 * Connector catalog for the Integrations gallery. Drives a marketplace-style page.
 * `status`: "available" = built (connect on an employee) · "coming_soon" = planned.
 * `type` maps to a brand in components/ui/brand-icon.tsx.
 */

export type IntegrationStatus = "available" | "coming_soon";

export interface Integration {
  type: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  note?: string; // e.g. "via Microsoft 365"
}

export interface IntegrationCategory {
  category: string;
  blurb: string;
  items: Integration[];
}

export const INTEGRATIONS: IntegrationCategory[] = [
  {
    category: "Engineering & code",
    blurb: "Commits, PRs, issues, and READMEs — the paper trail of what an engineer built.",
    items: [
      { type: "github", name: "GitHub", description: "Commits, PRs, issues, READMEs", status: "available" },
      { type: "gitlab", name: "GitLab", description: "Merge requests, issues, repos", status: "coming_soon" },
      { type: "bitbucket", name: "Bitbucket", description: "Pull requests & repositories", status: "coming_soon" },
      { type: "azuredevops", name: "Azure DevOps", description: "Boards, repos & pipelines", status: "coming_soon" },
    ],
  },
  {
    category: "Docs & productivity",
    blurb: "Where the written knowledge lives — docs, drives, mail, and wikis.",
    items: [
      { type: "google", name: "Google Workspace", description: "Drive, Docs & Gmail", status: "available" },
      { type: "microsoft", name: "Microsoft 365", description: "Outlook, OneDrive/SharePoint, Teams", status: "available" },
      { type: "confluence", name: "Confluence", description: "Wiki pages & spaces", status: "available", note: "via Atlassian" },
      { type: "notion", name: "Notion", description: "Docs, wikis & databases", status: "coming_soon" },
    ],
  },
  {
    category: "Project management",
    blurb: "Roadmaps, tickets, and the decisions behind them.",
    items: [
      { type: "jira", name: "Jira", description: "Issues, sprints & projects", status: "available", note: "via Atlassian" },
      { type: "linear", name: "Linear", description: "Issues & project cycles", status: "coming_soon" },
      { type: "asana", name: "Asana", description: "Tasks & projects", status: "coming_soon" },
      { type: "monday", name: "monday.com", description: "Boards & workflows", status: "coming_soon" },
      { type: "trello", name: "Trello", description: "Boards & cards", status: "coming_soon" },
      { type: "clickup", name: "ClickUp", description: "Tasks, docs & goals", status: "coming_soon" },
    ],
  },
  {
    category: "Communication",
    blurb: "The conversations where tacit knowledge and decisions actually happen.",
    items: [
      { type: "teams", name: "Microsoft Teams", description: "Chats & channel messages", status: "available", note: "via Microsoft 365" },
      { type: "slack", name: "Slack", description: "Channels & threads", status: "coming_soon" },
      { type: "discord", name: "Discord", description: "Servers & channels", status: "coming_soon" },
      { type: "zoom", name: "Zoom", description: "Meeting recordings & transcripts", status: "coming_soon" },
    ],
  },
  {
    category: "CRM & revenue",
    blurb: "Account history and relationships for sales & success handovers.",
    items: [
      { type: "salesforce", name: "Salesforce", description: "Accounts, opportunities & notes", status: "coming_soon" },
      { type: "hubspot", name: "HubSpot", description: "Contacts, deals & activity", status: "coming_soon" },
    ],
  },
  {
    category: "HR & people",
    blurb: "Org context, roles, and process knowledge from the people systems.",
    items: [
      { type: "bamboohr", name: "BambooHR", description: "Org, roles & policies", status: "coming_soon" },
      { type: "workday", name: "Workday", description: "HCM records & processes", status: "coming_soon" },
    ],
  },
];

export function integrationCounts(): { available: number; coming: number; total: number } {
  const all = INTEGRATIONS.flatMap((c) => c.items);
  const available = all.filter((i) => i.status === "available").length;
  return { available, coming: all.length - available, total: all.length };
}
