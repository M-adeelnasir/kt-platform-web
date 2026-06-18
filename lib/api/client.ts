/**
 * Typed API client. All frontend↔backend traffic goes through here, using types generated
 * from the FastAPI OpenAPI schema (`npm run gen:api` -> lib/api/generated.ts), so the HTTP
 * boundary stays type-safe (plan §6).
 */
import { API_BASE_URL } from "../env";
import type { components } from "./generated";

export type WorkspaceContext = components["schemas"]["WorkspaceContextOut"];
export type HealthResponse = components["schemas"]["HealthResponse"];
export type KnowledgeBase = components["schemas"]["KnowledgeBaseOut"];
export type KnowledgeBaseDetail = components["schemas"]["KnowledgeBaseDetailOut"];
export type Employee = components["schemas"]["EmployeeOut"];
export type EmployeeDetail = components["schemas"]["EmployeeDetailOut"];
export type Dashboard = components["schemas"]["DashboardOut"];

export function getDashboard(): Promise<Dashboard> {
  return apiFetch<Dashboard>("/dashboard");
}

export type Analytics = components["schemas"]["AnalyticsOut"];
export type KnowledgeRisk = components["schemas"]["KnowledgeRiskOut"];

export function getAnalytics(): Promise<Analytics> {
  return apiFetch<Analytics>("/analytics");
}
export function getKnowledgeRisk(): Promise<KnowledgeRisk> {
  return apiFetch<KnowledgeRisk>("/knowledge-risk");
}
export type GroundedAnswer = components["schemas"]["GroundedAnswer"];
export type JobEnqueued = components["schemas"]["JobEnqueuedResponse"];
export type JobResult = components["schemas"]["JobResultResponse"];

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`API ${status}: ${message}`);
    this.name = "ApiError";
  }
}

interface FetchOptions {
  token?: string | null;
  init?: RequestInit;
}

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers = new Headers(opts.init?.headers);
  // Only set Content-Type when there's a body. Setting it on GETs makes them "non-simple"
  // requests, which triggers a CORS preflight (OPTIONS) on every call — wasteful when polling.
  if (opts.init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts.init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return (await res.json()) as T;
}

export function getWorkspaceContext(token?: string | null): Promise<WorkspaceContext> {
  return apiFetch<WorkspaceContext>("/workspace/me", { token });
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

export function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  return apiFetch<KnowledgeBase[]>("/knowledge-bases");
}

export function getKnowledgeBase(id: string): Promise<KnowledgeBaseDetail> {
  return apiFetch<KnowledgeBaseDetail>(`/knowledge-bases/${id}`);
}

export function createKnowledgeBase(subjectPersonName: string): Promise<KnowledgeBase> {
  return apiFetch<KnowledgeBase>("/knowledge-bases", {
    init: { method: "POST", body: JSON.stringify({ subject_person_name: subjectPersonName }) },
  });
}

export function ingestText(
  kbId: string,
  doc: { title: string; text: string; url?: string },
): Promise<JobEnqueued> {
  return apiFetch<JobEnqueued>(`/knowledge-bases/${kbId}/ingest`, {
    init: { method: "POST", body: JSON.stringify(doc) },
  });
}

export function getJob(taskId: string): Promise<JobResult> {
  return apiFetch<JobResult>(`/jobs/${taskId}`);
}

export function askQuestion(kbId: string, question: string): Promise<GroundedAnswer> {
  return apiFetch<GroundedAnswer>(`/knowledge-bases/${kbId}/ask`, {
    init: { method: "POST", body: JSON.stringify({ question }) },
  });
}

export type KnowledgeItem = components["schemas"]["KnowledgeItemOut"];

export function synthesizeKb(kbId: string): Promise<JobEnqueued> {
  return apiFetch<JobEnqueued>(`/knowledge-bases/${kbId}/synthesize`, {
    init: { method: "POST" },
  });
}

export function getKnowledgeItems(kbId: string): Promise<KnowledgeItem[]> {
  return apiFetch<KnowledgeItem[]>(`/knowledge-bases/${kbId}/knowledge-items`);
}

export type UnansweredQuestion = components["schemas"]["UnansweredQuestionOut"];

export function getUnanswered(kbId: string): Promise<UnansweredQuestion[]> {
  return apiFetch<UnansweredQuestion[]>(`/knowledge-bases/${kbId}/unanswered`);
}

export type OnboardingView = components["schemas"]["OnboardingViewOut"];
export type OnboardingStep = components["schemas"]["OnboardingStepOut"];

export function getOnboarding(kbId: string): Promise<OnboardingView> {
  return apiFetch<OnboardingView>(`/knowledge-bases/${kbId}/onboarding`);
}

// --- Interviews ---

export type InterviewStart = components["schemas"]["InterviewStartResponse"];
export type InterviewDetail = components["schemas"]["InterviewDetailOut"];
export type InterviewFinish = components["schemas"]["InterviewFinishResponse"];

export function startInterview(kbId: string): Promise<InterviewStart> {
  return apiFetch<InterviewStart>(`/knowledge-bases/${kbId}/interviews`, {
    init: { method: "POST" },
  });
}

export function getInterview(interviewId: string): Promise<InterviewDetail> {
  return apiFetch<InterviewDetail>(`/interviews/${interviewId}`);
}

export function answerInterview(
  interviewId: string,
  answer: string,
): Promise<{ question: string }> {
  return apiFetch<{ question: string }>(`/interviews/${interviewId}/answer`, {
    init: { method: "POST", body: JSON.stringify({ answer }) },
  });
}

export function finishInterview(interviewId: string): Promise<InterviewFinish> {
  return apiFetch<InterviewFinish>(`/interviews/${interviewId}/finish`, {
    init: { method: "POST" },
  });
}

// --- Employees ---

export function listEmployees(): Promise<Employee[]> {
  return apiFetch<Employee[]>("/employees");
}

export function createEmployee(body: {
  name: string;
  email: string;
  title?: string;
  github_username?: string;
  status?: string;
  connectors?: string[];
}): Promise<Employee> {
  return apiFetch<Employee>("/employees", {
    init: { method: "POST", body: JSON.stringify(body) },
  });
}

export function getEmployee(id: string): Promise<EmployeeDetail> {
  return apiFetch<EmployeeDetail>(`/employees/${id}`);
}

export function updateEmployee(
  id: string,
  patch: { name?: string; email?: string; title?: string; github_username?: string },
): Promise<EmployeeDetail> {
  return apiFetch<EmployeeDetail>(`/employees/${id}`, {
    init: { method: "PATCH", body: JSON.stringify(patch) },
  });
}

export function setEmployeeStatus(id: string, status: string): Promise<EmployeeDetail> {
  return apiFetch<EmployeeDetail>(`/employees/${id}/status`, {
    init: { method: "POST", body: JSON.stringify({ status }) },
  });
}

// --- Connectors ---

type ConnectStart = components["schemas"]["ConnectStartResponse"];

export function startConnector(sourceType: string, employeeId: string): Promise<ConnectStart> {
  return apiFetch<ConnectStart>(
    `/connectors/${sourceType}/start?employee_id=${encodeURIComponent(employeeId)}`,
    { init: { method: "POST" } },
  );
}

export function syncSource(sourceId: string): Promise<JobEnqueued> {
  return apiFetch<JobEnqueued>(`/connectors/sources/${sourceId}/sync`, {
    init: { method: "POST" },
  });
}
