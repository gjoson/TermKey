# TermKey ⌨️

TermKey is a web-based prototype for a custom Android keyboard tailored specifically for power users interacting with Large Language Models (LLMs) via Termux. 

It bridges the gap between a standard mobile typing experience (like Gboard) and the advanced requirements of terminal-based AI chat interfaces.

![TermKey Icon](https://github.com/user-attachments/assets/placeholder-icon) <!-- Replace with actual icon path if uploaded to repo -->

## ✨ Features

* **Gboard-like UX:** Meticulously matched key dimensions, spacing, and flex-based responsive layout to preserve your existing muscle memory.
* **Conversational Predictive Text:** Unlike standard terminal keyboards, TermKey's dictionary and bigram predictions are optimized for natural language chat, making it easier to converse with LLMs.
* **Continuous Backspace:** Press and hold the backspace key to rapidly delete text.
* **Customizable Function Keys:** A dedicated row for user-defined macros/commands (e.g., `ls -la`, `git status`, `clear`). Includes an in-app edit modal to map labels and commands (supports auto-execution via `\n`).
* **Quick-Access Symbols:** Easy access to essential terminal characters: `| > < & ; * ~ $ # {} [] () \/ - _ = " '`.
* **Advanced Terminal Navigation:**
  * **Word Jumping:** Use `Alt + B` (Back) and `Alt + F` (Forward) to quickly jump between words.
  * **Terminal Scrolling:** Dedicated `PgUp` and `PgDn` keys to scroll through terminal history.
* **Modifier Keys:** Toggleable `Ctrl` and `Alt` keys for complex terminal shortcuts.
* **Smart Enter Key:** Standard `Enter` sends the prompt. `Shift + Enter` or `Alt + Enter` inserts a newline character without sending.
* **File Path Autocomplete:** Type `@` or `/` to instantly trigger a file picker/autocomplete in the suggestion bar, making it easy to "attach" files to your prompt.
* **Adjustable Opacity:** A built-in slider to adjust the keyboard's transparency, allowing you to see the terminal output underneath.
* **Theming:** Switch between Dark, Light, and "Hacker" (green on black) themes.

## 🚀 Getting Started (Web Prototype)

This repository contains the web-based React prototype. To run it locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/termkey.git
   cd termkey
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Path to Native Android (IME)

**Important:** This project is currently a web-based prototype built with React and Tailwind CSS. It *cannot* be installed directly as a system-wide Android keyboard via an APK.

To turn TermKey into a fully functional Android keyboard that you can use inside the actual Termux app:

1. **Set up Android Studio:** Create a new Android project.
2. **Implement `InputMethodService`:** Android requires custom keyboards (IMEs) to be written natively (Java/Kotlin) extending the `InputMethodService` class.
3. **Port the Logic:** Use this React codebase as a blueprint. The key dimensions, flex layouts, predictive text dictionaries, and custom logic (like continuous backspace and file autocomplete) can be directly translated into Android XML layouts and Kotlin logic.

## 💻 Tech Stack

* **Framework:** React 19
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Build Tool:** Vite
* **Language:** TypeScript

## 📝 Customizing Function Keys

1. Click the **Settings (gear)** icon in the top right of the app header.
2. Click the **Edit (pencil)** icon next to any function key, or the **+** button to add a new one.
3. Set the **Label** (what appears on the key) and the **Command**.
4. Add `\n` to the end of your command if you want it to execute immediately upon tapping.

## 📄 License

MIT License
