# 🎮 Titan Hex --- Strategic Hexagonal Board Game

**Titan Hex** is a two-player competitive strategy game played on a
multi-layer hexagonal grid. Each player commands powerful Titans, fights
for edge control, and battles against timers to gain the highest score
before the game ends. The game emphasizes tactical positioning, area
domination, and dynamic scoring through controlled edges.

------------------------------------------------------------------------

## 🌀 **Hexagonal Grid Structure**

The Titan Hex board consists of **three concentric hexagonal circuits**,
each with *6 nodes*:

-   **Outer Circuit (6 nodes)**
-   **Middle Circuit (6 nodes)**
-   **Inner Circuit (6 nodes)**

Edge weights **increase** as the circuits move inward, making central
nodes more valuable for scoring.

------------------------------------------------------------------------

## ♟ **Player Titans**

-   Two players: **Red** and **Blue**
-   Each player controls **four Titans**
-   Titans can be:
    -   **Placed** on unlocked circuits
    -   **Moved** through adjacent connected edges
-   A Titan surrounded on all adjacent nodes by the opponent is
    **eliminated permanently**

------------------------------------------------------------------------

## ⏳ **Timers**

-   **Overall Game Timer:** Ends the entire match when time reaches zero
-   **Turn Timer:** Each player has limited time each move

Timers keep gameplay fast and competitive.

------------------------------------------------------------------------

## 🎮 **Gameplay Phases**

### **1. Placement Phase**

-   Players alternate placing Titans on the *outer circuit* at game
    start
-   When a circuit fills, the **next inner circuit unlocks**
-   Players may choose to either:
    -   Place a new Titan
    -   Move an existing Titan

------------------------------------------------------------------------

### **2. Movement Phase**

Begins once all Titans are placed.

Players take turns moving **one Titan** at a time along adjacent edges.\
Movement rules: - Only along **connected lines** - No diagonal jumps -
Captured Titans are removed from board

------------------------------------------------------------------------

## ⭐ **Scoring System**

Players earn points by controlling edges:

-   An edge is controlled if **both connected nodes belong to the same
    player**
-   Score increases by the **weight of that edge**
-   If a Titan moves and breaks the edge control, that weight is
    **deducted**

Inner edges are worth **more points**, rewarding strategic central
dominance.

------------------------------------------------------------------------

## 🏆 **Winning Conditions**

The game ends when:

1.  The **overall timer** expires
2.  The **inner hexagon** becomes fully occupied

The player with the **highest score** wins.\
A **confetti celebration** animation is displayed for the winner.

------------------------------------------------------------------------

## 🌗 **Light / Dark Mode**

The game includes a **theme toggle switch** with:

-   Light mode for clarity
-   Dark mode for immersive play

Theme switching updates the entire UI instantly.

------------------------------------------------------------------------

## 📁 **Project Structure**

    /Titan-Hex
    │── index.html
    │── style.css
    │── script.js
    │── README.md

-   `index.html` → Game layout and UI elements\
-   `style.css` → Board graphics, themes, animations\
-   `script.js` → Game logic, scoring, movement, timers, confetti

------------------------------------------------------------------------

## 🚀 **How to Run**

1.  Download or clone this repository:

    ``` bash
    git clone https://github.com/rohithagarwal/TITANCIRCUIT.git
    ```

2.  Open the **index.html** file in any modern browser.\

3.  Play!

------------------------------------------------------------------------

## 📌 **Features Coming Soon (Optional Roadmap)**

-   AI opponent mode\
-   Mobile-responsive layout\
-   Sound effects and music\
-   Online multiplayer\
-   Game replay system

------------------------------------------------------------------------

## 🤝 **Contributing**

Contributions are welcome!\
Feel free to open: - Issues\
- Pull requests\
- Feature suggestions

------------------------------------------------------------------------

## 📜 **License**

You can add your preferred license (MIT recommended).\
If you want, I can generate one.
