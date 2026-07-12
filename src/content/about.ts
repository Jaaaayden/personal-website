/** A bio line; `note: true` renders it smaller and bold. */
export type BioParagraph = string | { text: string; note: true };

export const BIO: Record<"work" | "hobbies", BioParagraph[]> = {
  work: [
    "CS student @ UCLA",
    "Currently working for the Department of Economics, preventing bruinwalk.com site outages for my fellow bruins registering for classes, and dabbling into game development/AI safety! If any of that intrigues you, reach out to me at jaydenle@g.ucla.edu!",
  ],
  hobbies: [
    "When I'm not glued to my computer screen, I'm tryharding card/board games alongside family and friends, demolishing delicious food (can't go wrong with KBBQ, hotpot, and fresh sushi), or enjoying a nice breeze at the beach!",
    {
      text: "always (and I mean always) looking to broaden my food/music horizons so reach out! :D",
      note: true,
    },
  ],
};
