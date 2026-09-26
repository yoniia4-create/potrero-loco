import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// El build genera un único index.html autocontenido (fácil de compartir o subir a itch.io).
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
