import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        background: "src/background.ts",
        content: "src/content.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "src/style/style.css", dest: "style" },
        {
          src: "src/style/effect.css",
          dest: "style",
        },
      ],
    }),
  ],
});
