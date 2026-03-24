# 📮 ulakSSH

**ulakSSH** is a modern, user-friendly, and powerful Electron-based SSH and SFTP management client. It allows you to easily manage your servers, execute commands, transfer files, and monitor system resources in real-time.

## 📜 Origin of the Name: "Ulak"

The name **"Ulak"** originates from **Old Turkish**. Historically used to refer to a messenger, envoy, or courier, this name symbolizes the fast, reliable, and continuous communication (messaging) between you and your servers. Just like the messengers of ancient times, this application swiftly delivers your commands and data to even the most remote servers.

---

## 🚀 Key Features

### 💻 Advanced SSH Terminal
- **xterm.js Power:** A fluid and error-free experience with the industry-standard terminal emulator.
- **Color & Typography:** Highly readable, customizable terminal themes.
- **Shortcut Support:** Keyboard shortcuts to speed up terminal operations.
- **Automatic Elevation:** Support for automatic `sudo su` root access upon connection, configurable in settings.

### 📂 SFTP and File Management
- **Visual Interface:** Navigate the file system without being overwhelmed by the command line.
- **Fast Transfer:** Quick file upload/download with drag-and-drop support and queue management.
- **File Editing:** Open and edit files directly on the server using the built-in code editor (based on Monaco Editor).
- **Permission Management:** Easily change file and folder permissions (chmod).

### 📜 Smart Script Management
- **Script Library:** Save your frequently used command sequences (e.g., Docker restart, log cleaning, updates).
- **Color Coding:** Categorize your scripts by assigning different colors.
- **One-Click Execution:** Trigger scripts instantly from the server detail page.
- **Output Tracking:** Monitor the output of running scripts in real-time through a dedicated log window.

### 📊 Real-Time System Monitoring
- **CPU & RAM:** Track your server's instantaneous processor load and memory usage graphically.
- **Disk Status:** View disk partition occupancy rates and read/write speeds.
- **Network Traffic:** Analyze incoming and outgoing data traffic (Inbound/Outbound) with bandwidth charts.
- **System Info:** Access OS version, uptime, and hardware details at a glance.

---

## 🛠️ Technology Stack

-   **Core:** [Electron](https://www.electronjs.org/) (Desktop application framework)
-   **Build Tools:** [Vite](https://vitejs.dev/) & [TypeScript](https://www.typescriptlang.org/)
-   **Frontend:** [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
-   **Visualization:** [Recharts](https://recharts.org/) (Charts) & [Lucide](https://lucide.dev/) (Icons)
-   **Terminal:** [xterm.js](https://xtermjs.org/)
-   **Communication:** [ssh2](https://github.com/mscdex/ssh2) (SSH2 library for Node.js)

---

## 📦 Installation and Development

To run the project in your local environment or contribute:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/osmn-byhn/ulakSSH.git
    cd ulakSSH
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Development Mode:**
    ```bash
    npm run dev
    ```

4.  **Packaging for Production:**
    ```bash
    npm run build:electron
    ```

## 📝 License

This project is licensed under the **MIT License**. For more information, please see the `LICENSE` file.

---

Developed by: **[Osman Beyhan](https://github.com/osmn-byhn)**
