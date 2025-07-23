# Thardferr Battle Calculator

This is a battle calculator for the online strategy game [Thardferr](https://thardferr.com). It is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

*   **Detailed Battle Simulation**: Simulates battles with a high degree of accuracy, taking into account unit stats, racial abilities, and strategic advantages.
*   **Dynamic Loss Calculation**: Accurately calculates land, castle, and building losses based on the decisiveness of the battle.
*   **Advanced Stat Analysis**: Provides a detailed breakdown of unit performance, including damage dealt, mitigation, and casualties.
*   **Race and Strategy Modifiers**: Correctly applies bonuses and penalties for all racial strategies, ensuring an authentic simulation of in-game mechanics.
*   **Building Passives**: Accurately models the effects of defensive buildings like Guard Towers and Medical Centers.

## How to Run This Project Locally

To run this calculator on your own computer, you'll need to follow these steps.

### Prerequisites

Before you begin, make sure you have the following software installed on your computer:

*   **Node.js**: This is a JavaScript runtime that allows you to run the project. You can download it from the official website: [nodejs.org](https://nodejs.org/). Installing Node.js will also install `npm`, which is a package manager you will need.
*   **Git**: This is a version control system used to download the project's code. You can download it from [git-scm.com](https://git-scm.com/).

### Step-by-Step Instructions

1.  **Download the Code**
    Open your terminal (on Mac/Linux) or Command Prompt/PowerShell (on Windows) and run the following command to copy the project's code to your computer:
    ```bash
    git clone https://github.com/vicke/thardferr-calculator.git
    ```

2.  **Navigate to the Project Directory**
    Once the download is complete, change your current directory to the newly created project folder:
    ```bash
    cd thardferr-calculator
    ```

3.  **Install Dependencies**
    Now, you need to download all the packages that the project depends on. Run the following command:
    ```bash
    npm install
    ```

4.  **Start the Application**
    Finally, you can start the application with this command:
    ```bash
    npm run dev
    ```

5.  **View the Calculator**
    Open your web browser and navigate to [http://localhost:3000](http://localhost:3000). You should now see the Thardferr Battle Calculator running!

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
