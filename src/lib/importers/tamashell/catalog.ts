export type TamaShellFamily =
  | "Vintage"
  | "Connection"
  | "Modern"
  | "Classic Remakes"
  | "Others";

export interface TamaShellCatalogEntry {
  slug: string;
  name: string;
  family: TamaShellFamily;
}

/** Device pages from https://www.tamashell.com navigation (excluding folder links). */
export const TAMASHELL_CATALOG: TamaShellCatalogEntry[] = [
  { slug: "gen1", name: "Tamagotchi P1", family: "Vintage" },
  { slug: "gen2", name: "Tamagotchi P2", family: "Vintage" },
  { slug: "angel", name: "Tamagotchi Angel", family: "Vintage" },
  { slug: "genjintchi", name: "Genjintchi", family: "Vintage" },
  { slug: "mothra", name: "Mothra Tamagotchi", family: "Vintage" },
  { slug: "mesuosu", name: "Mesutchi & Osutchi", family: "Vintage" },
  { slug: "garden", name: "Tamagotchi Garden", family: "Vintage" },
  { slug: "ocean", name: "Tamagotchi Ocean", family: "Vintage" },
  { slug: "tamaotch", name: "TamaOtch", family: "Vintage" },
  { slug: "doraemon", name: "Doraemontchi", family: "Vintage" },
  { slug: "monster", name: "Tamagotchi Monster", family: "Vintage" },
  { slug: "yasashii", name: "Yasashii Tamagotchi", family: "Vintage" },
  { slug: "santa", name: "Santaclautchi", family: "Vintage" },
  { slug: "connectionv1", name: "Tamagotchi Connection v1", family: "Connection" },
  { slug: "ktama", name: "Keitai Kaitsuu Tamagotchi Plus", family: "Connection" },
  { slug: "mini", name: "Tamagotchi Mini", family: "Connection" },
  { slug: "connectionv2", name: "Tamagotchi Connection v2", family: "Connection" },
  { slug: "entama", name: "Chou Jinsei Enjoi Tamagotchi Plus", family: "Connection" },
  { slug: "connectionv3", name: "Tamagotchi Connection v3", family: "Connection" },
  { slug: "uratama", name: "Ura Jinsei Enjoi Tamagotchi Plus", family: "Connection" },
  { slug: "connectionv4", name: "Tamagotchi Connection v4", family: "Connection" },
  { slug: "tamagochu", name: "TamagoChu", family: "Connection" },
  { slug: "connectionv45", name: "Tamagotchi Connection v4.5", family: "Connection" },
  { slug: "connectionv5", name: "Tamagotchi Connection v5", family: "Connection" },
  { slug: "connectionv55", name: "Tamagotchi Connection v5.5", family: "Connection" },
  { slug: "connectionv6", name: "Tamagotchi Connection v6", family: "Connection" },
  { slug: "pluscolor", name: "Tamagotchi Plus Color", family: "Modern" },
  { slug: "tamaid", name: "Tamagotchi iD", family: "Modern" },
  { slug: "tttg", name: "TamaTown Tama Go", family: "Modern" },
  { slug: "nano", name: "Tamagotchi Nano", family: "Modern" },
  { slug: "idl", name: "Tamagotchi iD L", family: "Modern" },
  { slug: "tamaps", name: "Tamagotchi P's", family: "Modern" },
  { slug: "friends", name: "Tamagotchi Friends", family: "Modern" },
  { slug: "tama4u", name: "Tamagotchi 4U", family: "Modern" },
  { slug: "4uplus", name: "Tamagotchi 4U+", family: "Modern" },
  { slug: "mix", name: "Tamagotchi m!x", family: "Modern" },
  { slug: "licensed", name: "Licensed Tamagotchi Nanos", family: "Modern" },
  { slug: "meets", name: "Tamagotchi Meets / On", family: "Modern" },
  { slug: "pix", name: "Tamagotchi Pix", family: "Modern" },
  { slug: "smart", name: "Tamagotchi Smart", family: "Modern" },
  { slug: "uni", name: "Tamagotchi Uni", family: "Modern" },
  { slug: "paradise", name: "Tamagotchi Paradise", family: "Modern" },
  { slug: "20mini", name: "Kaette Kita! Chibi Tamagotchi", family: "Classic Remakes" },
  { slug: "original", name: "Original Tamagotchi", family: "Classic Remakes" },
  { slug: "connection20", name: "Tamagotchi Connection 20th Anniversary", family: "Classic Remakes" },
  { slug: "arukotchi", name: "Arukotchi", family: "Others" },
  { slug: "tamawalkie", name: "TamaWalkie", family: "Others" },
];

export const FAMILY_SLUG_MAP: Record<TamaShellFamily, string> = {
  Vintage: "vintage",
  Connection: "connection",
  Modern: "modern",
  "Classic Remakes": "classic-remakes",
  Others: "others",
};
