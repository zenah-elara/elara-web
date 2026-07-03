export type Collection = {
  name: string;
  slug: string;
  description: string;
  accent: string;
  badge?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  collection: string;
  image: string;
  imageUrl?: string;
  imageAlt?: string;
  images?: ProductImage[];
  stock: number;
  lowStockThreshold?: number;
  finishType?: "gold_plated" | "stainless_steel" | "non_tarnish" | null;
  finishNotes?: string | null;
  isSizeCustomizable?: boolean;
  sizeOptions?: string[];
  sizeLabel?: string | null;
  fixedSizeNote?: string | null;
  builderPriceTier?: "basic" | "premium";
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  materialDetails?: string;
  careInstructions?: string;
};

export type ProductImage = {
  id?: string;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number | null;
};

export const collections: Collection[] = [
  {
    name: "Ocean Collection",
    slug: "ocean-collection",
    description: "Soft shell charms, coastal textures, and pearl-lit details.",
    accent: "from-[#ffd7e6] via-[#fff6fb] to-[#dcecf0]",
    badge: "ocean charms",
  },
  {
    name: "Dainty Collection",
    slug: "dainty-collection",
    description: "Lightweight bracelets and everyday pieces with a gentle glow.",
    accent: "from-[#fff8f3] via-[#ffe7ef] to-[#f5c8d5]",
    badge: "soft everyday",
  },
  {
    name: "Gem Collection",
    slug: "gem-collection",
    description: "Delicate gem-inspired drops with polished gold accents.",
    accent: "from-[#ffe3ed] via-[#fff5fb] to-[#ece0ff]",
    badge: "gem drops",
  },
  {
    name: "Build Your Elara Piece",
    slug: "build-your-elara-piece",
    description: "Create a personal piece with curated chains, pendants, and charms.",
    accent: "from-[#ffe4ef] via-[#fff6f0] to-[#f5d29b]",
    badge: "custom",
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh pieces for soft styling and sweet everyday layering.",
    accent: "from-[#ffd8e8] via-[#fff8f2] to-[#f8e0ba]",
    badge: "new drop",
  },
  {
    name: "Best Sellers",
    slug: "best-sellers",
    description: "Customer favorites selected for gifting, stacking, and daily wear.",
    accent: "from-[#f6d491] via-[#fff4ef] to-[#ffdce8]",
    badge: "best loved",
  },
];

export const products: Product[] = [
  {
    id: "p-001",
    name: "Pink Heart Charm Necklace",
    slug: "pink-heart-charm-necklace",
    description: "A sweet gold-tone chain finished with a soft pink heart charm.",
    price: 480,
    collection: "Build Your Elara Piece",
    image: "Pink heart charm on warm blush silk",
    stock: 12,
    tags: ["heart", "gold", "custom"],
    isFeatured: true,
    isNewArrival: true,
    materialDetails: "Gold-tone chain with pink heart charm accent.",
    careInstructions: "Keep dry and store in a pouch after wear.",
  },
  {
    id: "p-002",
    name: "Pearl Dainty Bracelet",
    slug: "pearl-dainty-bracelet",
    description: "A slim bracelet with tiny pearl details for everyday stacking.",
    price: 390,
    collection: "Dainty Collection",
    image: "Pearl bracelet on cream linen",
    stock: 8,
    tags: ["pearl", "bracelet", "dainty"],
    isFeatured: true,
    isNewArrival: false,
    materialDetails: "Pearl-inspired beads with delicate gold-tone hardware.",
    careInstructions: "Avoid perfume and water to preserve the finish.",
  },
  {
    id: "p-003",
    name: "Ocean Shell Charm",
    slug: "ocean-shell-charm",
    description: "A coastal shell charm made for custom necklaces and bracelets.",
    price: 180,
    collection: "Ocean Collection",
    image: "Gold shell charm with soft sea glass tones",
    stock: 15,
    tags: ["shell", "ocean", "charm"],
    isFeatured: true,
    isNewArrival: true,
    materialDetails: "Gold-tone shell charm for custom necklaces or bracelets.",
    careInstructions: "Wipe gently with a soft cloth after styling.",
  },
  {
    id: "p-004",
    name: "Gem Drop Necklace",
    slug: "gem-drop-necklace",
    description: "A polished drop pendant with a gem-like blush centerpiece.",
    price: 520,
    collection: "Gem Collection",
    image: "Gem drop pendant on blush background",
    stock: 6,
    tags: ["gem", "pendant", "necklace"],
    isFeatured: true,
    isNewArrival: true,
    materialDetails: "Blush gem-style pendant on a polished gold-tone chain.",
    careInstructions: "Store separately to avoid scratches.",
  },
  {
    id: "p-005",
    name: "Gold Bow Charm",
    slug: "gold-bow-charm",
    description: "A feminine bow charm with a delicate gold finish.",
    price: 160,
    collection: "Build Your Elara Piece",
    image: "Gold bow charm on rose velvet",
    stock: 20,
    tags: ["bow", "gold", "charm"],
    isFeatured: false,
    isNewArrival: true,
    materialDetails: "Gold-tone bow charm made for custom elara. styling.",
    careInstructions: "Keep away from moisture and lotions.",
  },
  {
    id: "p-006",
    name: "Cherry Charm Bracelet",
    slug: "cherry-charm-bracelet",
    description: "A playful but polished bracelet with tiny cherry charm detail.",
    price: 420,
    collection: "Best Sellers",
    image: "Cherry charm bracelet with gold chain",
    stock: 4,
    tags: ["cherry", "bracelet", "best seller"],
    isFeatured: true,
    isNewArrival: false,
    materialDetails: "Gold-tone bracelet with cherry charm detail.",
    careInstructions: "Store flat and polish gently when needed.",
  },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function findCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function findProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
