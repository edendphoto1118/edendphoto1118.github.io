# EDEN - Interactive Visual Archive

An immersive photography portfolio website engineered with **Vanilla JavaScript** and **CSS3 Hardware Acceleration**. This project demonstrates high-performance DOM manipulation, custom cursor interactions, and seamless media transitions without heavy framework dependencies.

## 🌐 Live Demo
**Enter the Archive:** [https://edendphoto1118.github.io/](https://edendphoto1118.github.io/)

## 🚀 Technical Highlights

This project serves as a showcase for advanced frontend techniques & visual direction:

* **Core:** Pure Vanilla JavaScript (ES6+) for maximum performance. No frameworks.
* **Interaction:** Custom "Silver Particle" cursor system with orbital physics and dynamic hover states.
* **Layout:** Bespoke "Dark Archive" Zig-Zag editorial layout using CSS Grid & Flexbox.
* **Media:** Custom-built immersive modal gallery (Lightbox) with seamless transitions.
* **Audio:** JavaScript-controlled ambient audio player with visual sound wave simulation.
* **Animation:** CSS3 Keyframes & Transitions optimized for smooth 60fps rendering.
* **UI/UX:** Custom preloader sequence, progressive disclosure content loading, and responsive design.

## 🛠 Stack

* **HTML5** (Semantic Structure)
* **CSS3** (Custom Properties, Matte Silver Color Palette, Advanced Animations)
* **JavaScript** (ES6+, Logic for Cursor/Modal/Audio)
* **Zero Dependencies** (Removed all external libraries for pure code integrity)

## Magazine Updates

Magazine issues are generated from folders in `images/works`.

* `cover` is VOL.01.
* `cover2` is VOL.02.
* `cover18` is VOL.18.
* Incoming folders named `VOL.07`, `VOL.08`, etc. are renamed automatically to `cover7`, `cover8`, etc.
* Any number of image or video pages is supported.
* Supported media: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.mp4`, `.webm`, `.mov`, `.m4v`.
* Page files are sorted naturally, so `1.png`, `2.mp4`, `10.png` stay in the right order.

After adding or removing magazine folders or images, run:

```bash
node scripts/generate-magazines.js
```

This normalizes incoming folder names and refreshes `magazines-data.js`, which is the file read by the website.

Files dropped into `images/works/essentials` are also normalized automatically to `essentials (number).jpg` style names and published through the same data file.

To keep this automatic while editing locally, run:

```bash
node scripts/watch-magazines.js
```

The watcher also runs `scripts/auto-publish.js`, which commits and pushes detected changes to GitHub Pages.

---

> *Curating life through imagery.*
> **© 2025 EDEN. All Rights Reserved.**
