
Hooks.once("init", () => {
    console.log("Hello world!");
    const a = "12";
    const b = a + "2";
    console.log(b)
});

Hooks.on("renderActorSheetPF2e", (sheet: ActorSheetPF2e<ActorPF2e>) => {
      const actor = sheet.document;
    if (!actor.isOfType("npc", "character", "party")) return;
    sheet.form
        .querySelectorAll(".inventory ul.items > li[data-item-id]")
        .forEach((li) => {
            const id = (li as HTMLUListElement).dataset
                .itemId as string;
            const item = actor.items.get(id);
            if (!item || !item.isOfType("physical")) return;
            if (MonsterPart.hasMonsterPartData(item)) {
                const materials = new MonsterPart(item).materials;
                DynamicStyles.highlightElementOnHover(
                    li,
                    materials,
                    "refined-item",
                );
            } else if (RefinedItem.hasRefinedItemData(item)) {
                const refinedItem = new RefinedItem(item);
                const materials = (
                    AutomaticRefinementProgression.isEnabled
                        ? refinedItem.imbuements
                        : [
                            refinedItem.refinement,
                            ...refinedItem.imbuements,
                        ]
                ).map((m) => m.key);
                DynamicStyles.highlightElementOnHover(
                    li,
                    materials,
                    "monster-part",
                );
            }
        });
});