# Structure du Projet PWA STEP UP

```
📁 STEP UP/
├── 📁 src/                      # Code source principal
│   ├── 📁 assets/              # Ressources statiques
│   │   ├── 📁 icons/          # Icônes de l'application
│   │   ├── 📁 images/         # Images
│   │   └── 📁 fonts/          # Polices personnalisées
│   │
│   ├── 📁 components/         # Composants réutilisables
│   │   ├── 📄 Navigation.js   # Composant de menu principal
│   │   └── 📄 Layout.js       # Layout général de l'application
│   │
│   ├── 📁 pages/             # Pages principales
│   │   ├── 📄 POMODORO.js    # Page minuteur/pomodoro
│   │   ├── 📄 CHART.js       # Page statistiques
│   │   ├── 📄 HABITS.js      # Page calendrier
│   │   └── 📄 EISENHOWER.js  # Page tableau de bord
│   │
│   ├── 📁 styles/           # Fichiers de style
│   │   ├── 📄 main.css      # Styles globaux
│   │   └── 📄 variables.css # Variables CSS (thème, couleurs)
│   │
│   ├── 📁 utils/           # Utilitaires et helpers
│   │   └── 📄 helpers.js   # Fonctions utilitaires
│   │
│   └── 📁 services/        # Services (API, stockage local)
│       └── 📄 storage.js   # Gestion du stockage local
│
├── 📁 public/              # Fichiers publics
│   ├── 📄 index.html      # Point d'entrée HTML
│   ├── 📄 manifest.json   # Manifest PWA
│   ├── 📄 robots.txt      # Configuration robots
│   └── 📄 favicon.ico     # Favicon
│
├── 📁 config/             # Configuration
│   └── 📄 webpack.config.js # Configuration Webpack
│
├── 📄 package.json        # Dépendances et scripts
├── 📄 .gitignore         # Fichiers ignorés par Git
├── 📄 README.md          # Documentation
└── 📄 service-worker.js  # Service Worker pour la PWA
```

## Description des composants principaux

### Pages
- **POMODORO** : Page avec minuteur style Pomodoro
- **CHART** : Visualisation des données et graphiques
- **HABITS** : Gestion du calendrier et événements
- **EISENHOWER** : Vue d'ensemble et widgets configurables

### Composants principaux
- **Navigation** : Menu principal avec les 4 icônes
- **Layout** : Structure commune à toutes les pages

### PWA Features
- Manifest.json pour l'installation
- Service Worker pour le fonctionnement hors-ligne
- Responsive design pour tous les appareils

### Technologies recommandées
- Framework : React ou Vue.js
- Styling : CSS Modules ou Tailwind CSS
- Build : Webpack
- PWA : Workbox pour le Service Worker
