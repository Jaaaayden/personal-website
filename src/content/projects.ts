export const LANGUAGE_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Rust: "#84a1de",
  React: "#61dafb",
  PostgreSQL: "#336791",
  MongoDB: "#47a248",
  Supabase: "#3ecf8e",
} as const;

export interface Project {
  name: string;
  description: string;
  url: string;
  tags: (keyof typeof LANGUAGE_COLORS)[];
}

export const PROJECTS: Project[] = [
  {
    name: "Bruinwalk",
    description:
      "Rate your wonderful professors and find new courses at UCLA. 3,000+ daily users.",
    url: "https://bruinwalk.com",
    tags: ["Python", "PostgreSQL"],
  },
  {
    name: "K-12 Food Procurement",
    description: "Helping 100+ school districts in California stop overpaying for identical food products.",
    url: "https://schoolfoodlab.vercel.app/",
    tags: ["Python", "Supabase"],
  },
  {
    name: "Hobbify",
    description: "Go from 'I want to get into snowboarding for under $300 in LA' to a starter kit made up of secondhand listings on Facebook Marketplace/OfferUp.",
    url: "https://youtu.be/u6DL072I54w?si=mFd6_7xemgjwx1-c",
    tags: ["React", "MongoDB"],
  },
  {
    name: "BrainTease",
    description: "Google extension that allows you to solve chess puzzles and watch videos during LLM thinking!",
    url: "https://chromewebstore.google.com/detail/braintease/kbemolfghfobhaggbdaafkfoajfnfonk",
    tags: ["JavaScript"],
  },
];
