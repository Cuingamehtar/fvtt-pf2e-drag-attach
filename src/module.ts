import {
    ActorPF2e,
    ActorSheetPF2e,
    ItemPF2e,
    ItemSheetPF2e,
    PhysicalItemPF2e,
} from "@7h3laughingman/pf2e-types";
import { usages } from "./attachments-types";

let currentlyDragging = false;
Hooks.on("renderActorSheetPF2e", (sheet) => {
    const { actor, form } = sheet as ActorSheetPF2e<ActorPF2e>;
    if (!actor.isOfType("npc", "character", "party")) return;
    form.querySelectorAll(".inventory ul.items > li[data-item-id]").forEach(
        (li) => {
            const dataset = (li as HTMLUListElement).dataset;
            const id = dataset.itemId!;
            const item = (actor as ActorPF2e).items.get(id);
            if (!item) return;

            li.addEventListener("dragstart", () => dragItem(item));

            li.addEventListener("dragend", () => {
                if (!currentlyDragging) return;
                document
                    .querySelectorAll(".drag-attach-droppable")
                    .forEach((e) => e.remove());
                currentlyDragging = false;
            });
        },
    );
});

function dragItem(attachment: ItemPF2e) {
    if (!attachment) return;
    if (attachment.isOfType("physical")) {
        const usage = attachment._source.system.usage?.value;
        if (!usage) return;
        const predicate = new game.pf2e.Predicate(usages[usage] ?? []);
        const openWindows = Object.values(ui.windows).filter(
            (w): w is ItemSheetPF2e<PhysicalItemPF2e> =>
                isItemSheet(w) && w.item?.isOfType("physical"),
        );
        if (openWindows.length == 0) {
            return;
        }
        currentlyDragging = true;
        for (const { item, form } of openWindows) {
            const options = customRollOptions(item);
            const allowed = predicate.test(options);
            const n = document.createElement("div");
            n.classList.add(
                "drag-attach-droppable",
                allowed ? "allowed" : "denied",
            );
            if (allowed) {
                n.addEventListener("dragover", (event) =>
                    event.preventDefault(),
                );
                n.addEventListener("drop", (event) => {
                    event.preventDefault();
                    item.attach(attachment);
                });
            }
            form.querySelector("section.sidebar")?.appendChild(n);
        }
    }
}

function isItemSheet(
    window: foundry.appv1.api.Application<foundry.appv1.api.ApplicationV1Options>,
): window is ItemSheetPF2e<ItemPF2e> {
    return window.options.baseApplication === "ItemSheet";
}

function customRollOptions(item: ItemPF2e) {
    const base = item.getRollOptions("item");
    if (item.isOfType("physical")) {
        base.push(`usage:${item.system.usage.value}`);
        for (const at of item.subitems) {
            base.push(`attached:${at.slug}`);
        }
        if (item.bulk.isNegligible) {
            base.push(`item:bulk:negligible`);
        }
    }
    return base;
}
