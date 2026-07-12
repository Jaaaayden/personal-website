export type GalleryTag = "food" | "places" | "achievements";

export const GALLERY_SECTIONS: Record<GalleryTag, string> = {
  food: "good eats",
  places: "cool places",
  achievements: "random achievements",
};

export interface GalleryItem {
  /** Path under public/, e.g. "/gallery/kbbq.jpg". */
  src: string;
  caption: string;
  tag: GalleryTag;
  /** Landscape shots in the food/places tracks get a wider 4:3 tile. */
  wide?: boolean;
  /**
   * Achievements only: the tile's shape (e.g. "1284 / 2778"). Use the
   * image's native ratio to show it uncropped, or a smaller window's ratio
   * (with `focus` aiming it) to trim chrome off a screenshot.
   */
  aspect?: string;
  /** CSS object-position steering an achievement crop, e.g. "center 14%". */
  focus?: string;
}

export const GALLERY: GalleryItem[] = [
  // good eats
  { src: "/gallery/feast.png", caption: "feast's first day open as a dining hall (again) :D", tag: "food" },
  { src: "/gallery/w-bplate.png", caption: "best mashed i've ever had - ty bplate", tag: "food" },
  { src: "/gallery/gobbled.png", caption: "12 minutes to eat that last pic btw", tag: "food" },
  {
    src: "/gallery/ackerman-cf.png",
    caption: "sooo good",
    tag: "food",
  },
  {
    src: "/gallery/century-city-haidilao.png",
    caption: "haidilao run during finals week",
    tag: "food",
  },
  {
    src: "/gallery/san-diego-haidilao.png",
    caption: "more haidilao but receipt edition",
    tag: "food",
  },
  {
    src: "/gallery/sf-somewhere.png",
    caption: "might not have won cal hacks but ate good",
    tag: "food",
  },
  { src: "/gallery/izakaya-kopan.png", caption: "ty jose for treating bruinwalk to the best westwood food", tag: "food" },
  { src: "/gallery/joes.png", caption: "joe's ny slice was worth the line", tag: "food" },
  { src: "/gallery/smile.png", caption: "oh how i'll miss you food trucks", tag: "food" },
  { src: "/gallery/pasta.png", caption: "'the method' - landon", tag: "food" },
  {
    src: "/gallery/simple-beef-fried-rice.png",
    caption: "i love fried rice",
    tag: "food",
  },
  {
    src: "/gallery/good-ol-dennys.png",
    caption: "but regardless of whether it's a nice restaurant or a denny's, food only hits when you got good company",
    tag: "food",
  },

  // cool places
  { src: "/gallery/central-park.png", caption: "central park", tag: "places" },
  {
    src: "/gallery/statue-of-liberty.png",
    caption: "statue of liberty",
    tag: "places",
  },
  { src: "/gallery/uss-growler.png", caption: "uss growler", tag: "places" },
  {
    src: "/gallery/palace-of-fine-arts.png",
    caption: "palace of fine arts",
    tag: "places",
  },
  {
    src: "/gallery/blurry-but-nice.png",
    caption: "blurry but i thought it still looked cool",
    tag: "places",
  },
  { src: "/gallery/retreat.png", caption: "ai safety retreat", tag: "places" },
  {
    src: "/gallery/peace.png",
    caption: "imagine waking up to that view",
    tag: "places",
    wide: true,
  },
  {
    src: "/gallery/just-a-rubber-duck.png",
    caption: "not really a place but oh wow big rubber duck",
    tag: "places",
  },

  // random achievements
  {
    src: "/gallery/number-1-in-2020.png",
    caption: "might be too washed to hit top 500 nowadays but 12 y/o me was good at brawl stars </3",
    tag: "achievements",
    aspect: "2436 / 1125",
  },
  {
    src: "/gallery/chess-pb.png",
    caption: "not really a flex but need to post it here to motivate me to hit 40",
    tag: "achievements",
    // window from "New Record!" through the puzzle grid — no status bar,
    // no Play Again button
    aspect: "1284 / 2050",
    focus: "center 14%",
  },
  {
    src: "/gallery/tuyu-77.png",
    caption: "#77 tuyu listener worldwide",
    tag: "achievements",
    aspect: "1080 / 1920",
  },
];
