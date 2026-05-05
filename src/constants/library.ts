export interface Book {
  bookId: string;
  title: string;
  subtitle: string;
  bookNumber: number;
  coverImage: string;
  description: string;
  status: "available" | "coming-soon";
  paidOnly: boolean;
  totalChapters: number;
}

export const BOOKS: Book[] = [
  {
    bookId: "book-1",
    title: "Blood on the Yellow Brick",
    subtitle: "Red Country",
    bookNumber: 1,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBykLEiAnrtV0nDBWludqRBJgZBk564opUQ1enx_2caV5W-_L8_meV9Uj9qNCpRudjD1WoRFhzNNfJ0Z1sGEwwxKYFq5IArPE968skiVX2LiLYQafp8uHPpSLxsbx8dXI25jwmNh08j9rLVY9JCEpwULMhLLPAPmKdzaK6xFp8sxOPJEC9G4mGQunYPdXRfEhzqe0Ax21vN7tqn6yUAx2DxDBReTWw1LMF20ShFI2F0H0b1vH7aAAYi3wTa7i3yOe6vXHNj7WMa_StQ",
    description: "The storm took everything. Dorothy Gale must navigate a dying Oz to find the shards of her broken life.",
    status: "available",
    paidOnly: true,
    totalChapters: 24,
  },
  {
    bookId: "book-2",
    title: "Whispers in the Emerald Veil",
    subtitle: "The Poisoned City",
    bookNumber: 2,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUaHEhTgxR9amSf4Cf-0d4Ee-LUH9HBIXZ6EY8VKqu3V1tNGACgMKu-yINO3eIrSPwQ6EG82F9mG3BX5nKPcMxwcAYIhys1g7Xm9c36pJ-xz7UWMK0tjw5Swtg9vZFWkH3xOxTc-YIOpKANs8JGFHwlZTBf-RXziKi7GCtNHwDxRp41J9Dmm5n2gTV7HjLEZbBpJznVUUmqBoqHb94DHcJ_hfCGUIYA2acmJo4M5D7dzTWuaz44smEQtjX_uZVjjQVqALS0PqDUvcp",
    description: "Beyond the red dunes lies a city of glass and greed, where every shadow has a price.",
    status: "coming-soon",
    paidOnly: true,
    totalChapters: 20,
  },
  {
    bookId: "book-3",
    title: "The Lion of Rotwood Forest",
    subtitle: "Shattered Pride",
    bookNumber: 3,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi44PQ9kzwTJERp0H0hZLb3h1wy_7uBTlixFYERq7UlBBGYZQZvHytLBmMAp54nWMzr2GgsiUntxPQDhn35VaylIP0rBOePcMY8Uhak12H7doRUgmHfRHREbjll4Odx9VUIe4qGpVk1pBGJjC2NKpPH8Jvv3KdNIF1l2pKI7Jsmjn206sx1LDrOO6E12xCh4mduZGs8tFU6NlDP6ryxRUP4jx-2wmJucHrgm1JPb6kJfQxdomR0j60WnvUijKcW0YBNPnnMmI82AZF",
    description: "Courage is not the absence of fear, but the strength to feed it.",
    status: "coming-soon",
    paidOnly: true,
    totalChapters: 18,
  },
  {
    bookId: "book-4",
    title: "Shattered Fields of Straw",
    subtitle: "The Hollow Man",
    bookNumber: 4,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrz5QGeohTASnuLoQMKLm4Sb0g2OSAZDbqPheQ9QI-VKDi8yOCyz_Wt6AD8hk63fzBRFagDdyiI17wdcMy-76-if2G6R9a8IpldAU3b3DNtt0wOhcOhsgUV9bjUZWc6BQUEyVv7psk20-G9dpK_Bxfo6-itXyCtgfmZ-YU9Qq6NeSJ7crXzg1N3lM0csHweAGmNZ1zvrM2A_JGop5gXztvoGygX8crvfh9zVXuO6cIWAq7DpsuJC1tQIFYWmGimEQKty9Y7EAzXgmE",
    description: "Intelligence is a burden when the world refuses to make sense.",
    status: "coming-soon",
    paidOnly: true,
    totalChapters: 22,
  },
  {
    bookId: "book-5",
    title: "Shadows Over Silver Sands",
    subtitle: "The Silent Sea",
    bookNumber: 5,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHZM-iphSOu-yFGeqgFrsnQTEBDO_T1ZzfFugkHf7APTdVLiOUuYXgzNI9v7c5GfTUkMyP2h7rYqHcd1CSNODSvv6GPyOBd75OSKVSsnflU3lp5n5famqgNsAe_hCGw0TbxlN06DhZA4wwkKrijr-WhTTTHyruqgWbgdfk1dC1MAlfyGuXoeyeQZfgJYUYDuy68HvUU7Gosxrok-A8o5aJ9Lj6nFRojaIro1Pyd5g5YEleGwnhMPj-e410icNSPHjQIpDcPbpHZUa_",
    description: "The desert remembers everyone who ever died for a drink of water.",
    status: "coming-soon",
    paidOnly: true,
    totalChapters: 15,
  },
  {
    bookId: "book-6",
    title: "The Glass City of Midnight",
    subtitle: "Emerald Requiem",
    bookNumber: 6,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi44PQ9kzwTJERp0H0hZLb3h1wy_7uBTlixFYERq7UlBBGYZQZvHytLBmMAp54nWMzr2GgsiUntxPQDhn35VaylIP0rBOePcMY8Uhak12H7doRUgmHfRHREbjll4Odx9VUIe4qGpVk1pBGJjC2NKpPH8Jvv3KdNIF1l2pKI7Jsmjn206sx1LDrOO6E12xCh4mduZGs8tFU6NlDP6ryxRUP4jx-2wmJucHrgm1JPb6kJfQxdomR0j60WnvUijKcW0YBNPnnMmI82AZF",
    description: "The Wizard is dead. Long live the Horror.",
    status: "coming-soon",
    paidOnly: true,
    totalChapters: 30,
  },
];
