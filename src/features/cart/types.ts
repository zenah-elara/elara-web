export type BuilderSelectedCartItem = {
  productId: string;
  name: string;
  slug: string;
  productType: "charm" | "mini_charm" | "pendant" | "connector";
  price: number;
  quantity: number;
  imageUrl?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  finishType?: "gold_plated" | "stainless_steel" | "non_tarnish" | null;
  builderPriceTier?: "basic" | "premium";
  selectedSize?: string | null;
  sizeLabel?: string | null;
  arrangementOrder: number;
};

export type BuilderChainCartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  finishType?: "gold_plated" | "stainless_steel" | "non_tarnish" | null;
  builderPriceTier?: "basic" | "premium";
  selectedSize?: string | null;
  sizeLabel?: string | null;
};

export type BuilderComboType = "chain_main_charm" | "chain_mini_charm";

export type BuilderPricingSummary = {
  comboType: BuilderComboType;
  baseLabel: "Base necklace" | "Mini necklace";
  cartLabel: "Base necklace: chain + main charm" | "Mini necklace: chain + mini charm";
  includedDescription: "Includes chain + 1 main charm" | "Includes chain + 1 mini charm";
  basePrice: number;
  includedItem: {
    productId: string;
    name: string;
    productType: "charm" | "mini_charm" | "pendant";
  };
  addOns: {
    productId: string;
    name: string;
    productType: "charm" | "mini_charm" | "pendant" | "connector";
    label: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export type RegularCartItem = {
  cartItemId?: string;
  itemType?: "regular_product";
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  finishType?: "gold_plated" | "stainless_steel" | "non_tarnish" | null;
  selectedSize?: string | null;
  sizeLabel?: string | null;
  customLength?: string | null;
  customLengthLabel?: string | null;
};

export type CustomNecklaceCartItem = {
  cartItemId: string;
  itemType: "custom_necklace";
  productId: string;
  slug: string;
  name: "Custom Necklace";
  unitPrice: number;
  quantity: 1;
  chain: BuilderChainCartItem;
  chainLength: string | null;
  connector?: BuilderSelectedCartItem | null;
  selectedItems: BuilderSelectedCartItem[];
  pricingSummary?: BuilderPricingSummary;
};

export type CartItem = RegularCartItem | CustomNecklaceCartItem;

export type CartInput = Omit<RegularCartItem, "quantity"> & {
  quantity?: number;
};
