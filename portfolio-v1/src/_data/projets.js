import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

// Pourquoi ce fichier existe-t-il ?
// ----------------------------------
// Eleventy lit automatiquement les fichiers JSON dans _data/.
// Mais pour un DOSSIER (_data/projets/), il crée un OBJET keyed par nom de fichier :
//   projets = { "miam": {...}, "ecole-de-couture": {...} }
//
// Or les templates ont besoin d'un TABLEAU pour itérer avec {% for projet in projets %}.
// Ce fichier .js prend la priorité sur le dossier et retourne le tableau attendu.
//
// On en profite aussi pour injecter l'id depuis le nom de fichier,
// ce qui évite de devoir le saisir manuellement dans le CMS :
//   miam.json → { id: "miam", ... }

export default function () {
  const dir = resolve("./src/_data/projets");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(readFileSync(`${dir}/${f}`, "utf-8"));
      return { ...data, id: f.replace(".json", "") };
    });
}
