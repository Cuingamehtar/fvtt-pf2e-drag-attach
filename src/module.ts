import {
    ActorPF2e,
    ActorSheetPF2e,
    ItemPF2e,
} from "@7h3laughingman/pf2e-types";
import { usages } from "./attachments-types";

Hooks.once("init", () => {
    console.log("Hello world!");
    const a = "12";
    const b = a + "2";
    console.log(b);
});

Hooks.on("renderActorSheetPF2e", (sheet) => {
    const actor = (sheet as ActorSheetPF2e<ActorPF2e>).actor;
    const form = (sheet as ActorSheetPF2e<ActorPF2e>).form;
    if (!actor.isOfType("npc", "character", "party")) return;
    form.querySelectorAll(".inventory ul.items > li[data-item-id]").forEach(
        (li) => {
            const dataset = (li as HTMLUListElement).dataset;
            const id = usages[dataset.itemId as string] as string;
            dataset.idd = id;
        },
    );
});

function customRollOptions(item: ItemPF2e) {
    const base = item.getRollOptions();
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
