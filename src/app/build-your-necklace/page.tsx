import { NecklaceBuilder } from "@/components/builder/necklace-builder";
import { SectionHeader } from "@/components/section-header";
import {
  getBuilderChains,
  getBuilderCharmsAndPendants,
} from "@/features/catalog/queries";

export default async function BuildYourNecklacePage() {
  const [chains, builderItems] = await Promise.all([
    getBuilderChains(),
    getBuilderCharmsAndPendants(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Build Your Elara Piece"
        title="Create a piece that feels like you."
        description="Choose your chain, pick your length, add your pendants or mini charms, and arrange them your way. Whether it's simple, playful, or statement-making, your piece is built around your style."
      />
      <div className="mt-8">
        <NecklaceBuilder chains={chains} builderItems={builderItems} />
      </div>
    </section>
  );
}
