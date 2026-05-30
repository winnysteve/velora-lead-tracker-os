export const dailyTasks = [
  { id: "call-1", title: "Contact 5-10 businesses", detail: "Prioritize one niche and record objections." },
  { id: "follow-1", title: "Send 3 follow-ups", detail: "24h, 3d, and 7d follow-up discipline." },
  { id: "demo-1", title: "Improve one mockup", detail: "Make the demo easier to trust and book from." },
  { id: "ads-1", title: "Check Meta test once", detail: "Read UTM source, CTR, CPC, and conversion signal." },
  { id: "learn-1", title: "Capture one marketing lesson", detail: "Tool, decision rule, metric, mistake, application." },
  { id: "health-1", title: "Protect sleep and energy", detail: "No fake ambition through bad recovery." }
];

export const pipeline = [
  { label: "Calls", value: "42" },
  { label: "Demos", value: "9" },
  { label: "Follow-ups", value: "14" },
  { label: "Meetings", value: "3" },
  { label: "Clients", value: "1/3" },
  { label: "Cash", value: "$180" }
];

export const ecommerceMetrics = [
  { label: "Product hypothesis", value: "Light viral impulse buy" },
  { label: "Budget cap", value: "$150" },
  { label: "UTM source", value: "meta_summer_test" },
  { label: "CTR", value: "1.8%" },
  { label: "CPC", value: "$0.19" },
  { label: "Signal rule", value: "Kill or iterate by day 7" }
];

export const learningNotes = [
  { label: "Tool observed", value: "Campaign manager / reporting dashboard" },
  { label: "Decision rule", value: "Budget follows proof, not excitement." },
  { label: "Metric", value: "Cost per qualified lead" },
  { label: "Apply", value: "Use the same logic on client offers." }
];

export const weeklyMetrics = [
  { label: "Outreach", value: "42/50", progress: 84 },
  { label: "Follow-ups", value: "14/20", progress: 70 },
  { label: "Lessons", value: "4/5", progress: 80 },
  { label: "Skill reps", value: "9h", progress: 62 },
  { label: "Sleep", value: "6.8h", progress: 68 },
  { label: "Revenue", value: "$180", progress: 36 }
];

export const salesMetrics = [
  { label: "Conversation rate", value: "31%" },
  { label: "Demo-send rate", value: "21%" },
  { label: "Meeting rate", value: "7%" },
  { label: "Main objection", value: "Not priority now" },
  { label: "Next fix", value: "Stronger follow-up angle" }
];

export const skills = [
  { id: "skill-sales", title: "Sales and cold calling", path: "Openers, discovery, objection handling, closing.", level: "Core" },
  { id: "skill-offer", title: "Offer creation", path: "Sell bookings, trust, and speed instead of websites.", level: "Core" },
  { id: "skill-follow", title: "Follow-up discipline", path: "24h, 3d, 7d scripts and CRM tracking.", level: "Core" },
  { id: "skill-web", title: "Websites and landing pages", path: "Lovable/Codex builds with conversion-focused copy.", level: "Build" },
  { id: "skill-copy", title: "Copywriting and persuasion", path: "Hooks, proof, objections, CTAs, WhatsApp scripts.", level: "Build" },
  { id: "skill-dm", title: "Digital marketing fundamentals", path: "Customer journey, funnels, perception, touchpoints.", level: "Owned" },
  { id: "skill-meta", title: "Meta Ads", path: "Campaigns, creatives, budgets, UTM tracking.", level: "Next" },
  { id: "skill-analytics", title: "Analytics", path: "CPC, CTR, CAC, conversion rate, profit/loss.", level: "Next" },
  { id: "skill-auto", title: "Automation and CRM", path: "Lead capture, booking, reminders, missed-lead recovery.", level: "Later" },
  { id: "skill-ecom", title: "Ecommerce testing", path: "Small tests, stop-loss rules, offer-market fit.", level: "Test" },
  { id: "skill-ai", title: "AI workflows", path: "ChatGPT, Claude, Lovable, Codex as output multipliers.", level: "Owned" },
  { id: "skill-school", title: "Math and physics", path: "Academic base and disciplined thinking.", level: "Base" }
];

const dotSets = [
  ["sales", "health"],
  ["ecom", "learning"],
  ["school", "review"],
  ["sales", "learning"],
  ["health", "review"]
];

export const roadmap = [
  {
    name: "June",
    days: 30,
    focus: "Set offer + demos",
    dots: dotSets,
    tasks: {
      1: ["Pick one niche", "Finalize 3 mockups", "Build outreach sheet"],
      7: ["Review first call objections", "Rewrite opener"],
      14: ["Send second follow-up wave", "Improve demo proof"],
      21: ["Launch ecommerce prep checklist", "Protect study baseline"],
      30: ["June review", "Choose July constraint"]
    }
  },
  {
    name: "July",
    days: 31,
    focus: "Calls + ecommerce test",
    dots: dotSets,
    tasks: {
      1: ["Start 7-day Meta Ads test", "Call 10 businesses"],
      7: ["Kill or iterate product angle", "Summarize ad data"],
      15: ["Book client meetings", "Capture company marketing lesson"],
      23: ["Push testimonials/case study", "Follow-up older leads"],
      31: ["July review", "Calculate revenue and spend"]
    }
  },
  {
    name: "August",
    days: 31,
    focus: "Close 3 clients",
    dots: dotSets,
    tasks: {
      1: ["Refine service package", "Raise price if proof exists"],
      10: ["Close or reject warm leads", "Document objections"],
      20: ["Package case study", "Create referral ask"],
      31: ["Summer review", "Decide school-year operating rhythm"]
    }
  },
  {
    name: "September",
    days: 30,
    focus: "School + systems",
    dots: dotSets,
    tasks: {
      1: ["Set school/business weekly schedule", "Reduce idea switching"],
      15: ["Audit CRM", "Improve follow-up scripts"],
      30: ["September review", "Score sleep consistency"]
    }
  },
  {
    name: "October",
    days: 31,
    focus: "Performance marketing",
    dots: dotSets,
    tasks: {
      1: ["Study Meta Ads structure", "Apply to one client/demo"],
      15: ["Build campaign teardown file", "Practice analytics"],
      31: ["October review", "Choose next skill bottleneck"]
    }
  },
  {
    name: "November",
    days: 30,
    focus: "Automation layer",
    dots: dotSets,
    tasks: {
      1: ["Design simple booking flow", "Map missed-lead recovery"],
      15: ["Build a CRM template", "Test follow-up automation"],
      30: ["November review", "Package system as an offer"]
    }
  },
  {
    name: "December",
    days: 31,
    focus: "Review + leverage",
    dots: dotSets,
    tasks: {
      1: ["Review all 2026 metrics", "List best proof assets"],
      15: ["Plan 2027 skill stack", "Choose one specialization"],
      31: ["Annual review", "Set next-year revenue target"]
    }
  }
];
