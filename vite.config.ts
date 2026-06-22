import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        sourcemap: true,
        rolldownOptions: {
            input: "src/ts/module.ts",
            output: {
                dir: "dist/",
                entryFileNames: "pf2e-drag-attach.js",
                format: "es",
            },
        },
    },
    plugins: [
        copy({
            targets: [{ src: "src/module.json", dest: "dist" }, {src: "src/styles", dest:"dist"}],
            hook: "writeBundle",
        }),
    ],
});