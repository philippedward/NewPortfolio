const nunjucks = require("nunjucks");

// Configurez le dossier contenant vos templates
nunjucks.configure("views", {
  autoescape: true,
  express: app, // si vous utilisez Express
});

// Vous pouvez également compiler une chaîne de caractères directement
const res = nunjucks.renderString("Hello {{ nom }}", { nom: "Utilisateur" });
console.log(res); // Affiche : Hello Utilisateur
