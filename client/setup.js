const fs = require('fs');
const path = require('path');

// Créer le dossier public s'il n'existe pas
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Contenu du fichier index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Organiz-Asso - Plateforme de communication pour associations" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Organiz-Asso</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

// Contenu du fichier manifest.json
const manifestJson = `{
  "short_name": "Organiz-Asso",
  "name": "Organiz-Asso - Plateforme de communication pour associations",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}`;

// Contenu du fichier robots.txt
const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:`;

// Écrire les fichiers
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);
fs.writeFileSync(path.join(publicDir, 'manifest.json'), manifestJson);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);

console.log('✅ Dossier public et fichiers créés avec succès !'); 