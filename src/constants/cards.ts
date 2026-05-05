export type CardType = 
  | "Character"
  | "Ally"
  | "Enemy"
  | "Relic"
  | "Location"
  | "Curse"
  | "Key"
  | "Story"
  | "Boss"
  | "Collection"
  | "Gear"
  | "Hazard"
  | "Map Fragment";

export type Rarity = 
  | "Starter"
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Founder";

export type Variant = 
  | "Standard"
  | "Starter Earned"
  | "First Edition"
  | "Genesis"
  | "Blood-Stained"
  | "Hologram"
  | "Corrupted"
  | "Ascended"
  | "Emerald Veil"
  | "Rotwood"
  | "Gilded"
  | "Silvered"
  | "Glass-Mirrored";

export interface MasterCard {
  cardId: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  book: string;
  campaign: string;
  variant: Variant;
  description: string;
  gameplayEffect: string;
  loreText: string;
  imageUrl: string;
  marketStatus: "active" | "inactive";
  tradeable: boolean;
  sellable: boolean;
  bound: boolean;
  approvedForPublicUse: boolean;
}

export const MASTER_CARDS: MasterCard[] = [
  // Starter
  {
    cardId: "dot-gale-ashbound",
    name: "Dot Gale — Ashbound Survivor",
    type: "Character",
    rarity: "Starter",
    book: "Book I",
    campaign: "Red Country",
    variant: "Starter Earned",
    description: "The storm took everything. Now, she takes it back.",
    gameplayEffect: "+2 Courage when moving to an Encounter node.",
    loreText: "The ashes of Kansas still cling to her boots, but her eyes are fixed on the horizon.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjM7ksuzL8kyqMHQLFHCmabsqGJ9tF2RdFb1nDRVlE1tMefjlgi6DAaEwWz1KIykaQmaJBRAcj_2pEMoZGNsYZ3yBD8qXEbj9OHymbqFAPRe9hZJgQ5UZGDChS12igFWvuyxQtFyhCczbMYQteo6DHhmxvByTkwKHVPQrBELmD15uCN_mIcIVypWcfasOlC1p2iihB4qr21eKFpShMs4DepFi7KH_YnU4DMMnij86uFRNf_76wuo5jB0aQOU5pJldY7IBJAfFWUniF",
    marketStatus: "active",
    tradeable: true,
    sellable: true,
    bound: false,
    approvedForPublicUse: true,
  },
  // Common
  {
    cardId: "rust-key",
    name: "Rust Key",
    type: "Key",
    rarity: "Common",
    book: "Book I",
    campaign: "Red Country",
    variant: "Standard",
    description: "A simple iron key, pitted with age.",
    gameplayEffect: "Unlocks the Rebel Trail Gate.",
    loreText: "Found in the ruins of a collapsed oil derrick. It feels heavy with expectation.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBykLEiAnrtV0nDBWludqRBJgZBk564opUQ1enx_2caV5W-_L8_meV9Uj9qNCpRudjD1WoRFhzNNfJ0Z1sGEwwxKYFq5IArPE968skiVX2LiLYQafp8uHPpSLxsbx8dXI25jwmNh08j9rLVY9JCEpwULMhLLPAPmKdzaK6xFp8sxOPJEC9G4mGQunYPdXRfEhzqe0Ax21vN7tqn6yUAx2DxDBReTWw1LMF20ShFI2F0H0b1vH7aAAYi3wTa7i3yOe6vXHNj7WMa_StQ",
    marketStatus: "active",
    tradeable: true,
    sellable: true,
    bound: false,
    approvedForPublicUse: true,
  },
  // Rare
  {
    cardId: "sir-hollin-thatch",
    name: "Sir Hollin Thatch — Broken Knight",
    type: "Ally",
    rarity: "Rare",
    book: "Book I",
    campaign: "Red Country",
    variant: "Standard",
    description: "A man of straw with a heart of steel.",
    gameplayEffect: "Absorbs 2 damage from any Hazard node.",
    loreText: "He remembers the smell of straw, but only knows the weight of his blade.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrz5QGeohTASnuLoQMKLm4Sb0g2OSAZDbqPheQ9QI-VKDi8yOCyz_Wt6AD8hk63fzBRFagDdyiI17wdcMy-76-if2G6R9a8IpldAU3b3DNtt0wOhcOhsgUV9bjUZWc6BQUEyVv7psk20-G9dpK_Bxfo6-itXyCtgfmZ-YU9Qq6NeSJ7crXzg1N3lM0csHweAGmNZ1zvrM2A_JGop5gXztvoGygX8crvfh9zVXuO6cIWAq7DpsuJC1tQIFYWmGimEQKty9Y7EAzXgmE",
    marketStatus: "active",
    tradeable: true,
    sellable: true,
    bound: false,
    approvedForPublicUse: true,
  },
  // Legendary
  {
    cardId: "marshal-argent-enforcer",
    name: "Marshal Argent — Law Without Mercy",
    type: "Boss",
    rarity: "Legendary",
    book: "Book I",
    campaign: "Red Country",
    variant: "Standard",
    description: "The Iron Maw's finest enforcer.",
    gameplayEffect: "Reduces player Health by 1 every turn spent in the City of Steel.",
    loreText: "He doesn't hate the rebels. He simply doesn't recognize their right to exist.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi44PQ9kzwTJERp0H0hZLb3h1wy_7uBTlixFYERq7UlBBGYZQZvHytLBmMAp54nWMzr2GgsiUntxPQDhn35VaylIP0rBOePcMY8Uhak12H7doRUgmHfRHREbjll4Odx9VUIe4qGpVk1pBGJjC2NKpPH8Jvv3KdNIF1l2pKI7Jsmjn206sx1LDrOO6E12xCh4mduZGs8tFU6NlDP6ryxRUP4jx-2wmJucHrgm1JPb6kJfQxdomR0j60WnvUijKcW0YBNPnnMmI82AZF",
    marketStatus: "active",
    tradeable: true,
    sellable: true,
    bound: false,
    approvedForPublicUse: true,
  }
];

