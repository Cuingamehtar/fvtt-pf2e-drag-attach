import {
    ActorPF2e,
    ActorSheetPF2e,
    ItemPF2e,
    ItemSheetPF2e,
    PhysicalItemPF2e,
} from "@7h3laughingman/pf2e-types";
import { SpecialPredicates, traits, usages } from "./attachments-types";

Hooks.once("init", () => {
    const loc = (() => {
        if (foundry.utils.isNewerVersion(game.version, 14)) return _loc;
        // @ts-expect-error "_loc shorthand isn't not present in v13"
        return game.i18n.format.bind(game.i18n);
    })();

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
            const predicateSource =
                attachment._source.system.traits.value
                    .map((t) => traits[t])
                    .find((t) => t) ??
                usages[attachment._source.system.usage?.value ?? ""];
            if (
                typeof predicateSource === "undefined" ||
                predicateSource === null
            )
                return;
            const always = predicateSource[0] === SpecialPredicates.Always;
            const predicate = new game.pf2e.Predicate(predicateSource);
            const openWindows = Object.values(ui.windows).filter(
                (w): w is ItemSheetPF2e<PhysicalItemPF2e> =>
                    isItemSheet(w) && w.item?.isOfType("physical"),
            );
            if (openWindows.length == 0) {
                return;
            }
            currentlyDragging = true;
            for (const window of openWindows) {
                const { item, form } = window;
                const options = customRollOptions(item);

                const { allowed, classes, message } = ((item) => {
                    if (item.id === attachment.id)
                        return {
                            allowed: false,
                            classes: ["denied"],
                            message: "same-item",
                        };
                    if (always)
                        return {
                            allowed: true,
                            classes: ["allowed", "unchecked"],
                            message: "drop-unchecked",
                        };
                    if (predicate.test(options))
                        return {
                            allowed: true,
                            classes: ["allowed"],
                            message: "drop",
                        };
                    return {
                        allowed: false,
                        classes: ["denied"],
                        message: "no-drop",
                    };
                })(item);

                const n = document.createElement("div");
                n.classList.add("drag-attach-droppable", ...classes);

                const p = document.createElement("p");
                p.innerHTML = loc(`pf2e-drag-attach.${message}`);
                n.appendChild(p);
                if (allowed) {
                    n.addEventListener("dragover", (event) => {
                        event.preventDefault();
                        n.classList.add("drag-over");
                    });
                    n.addEventListener("dragleave", () => {
                        n.classList.remove("drag-over");
                    });
                    n.addEventListener("drop", async (event) => {
                        event.preventDefault();
                        await item.attach(attachment);
                        await window.render(true);
                    });
                }
                form.querySelector("section.sidebar")?.appendChild(n);
            }
        }
    }
});

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
