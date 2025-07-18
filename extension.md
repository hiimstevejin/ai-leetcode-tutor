# Project Documentation: AI-Powered LeetCode Tutor Chrome Extension

## 1. Project Vision

The goal is to create a Chrome extension that acts as a personal tutor for data structure and algorithm problems on platforms like LeetCode. Instead of providing the solution outright, the extension will guide the user through the problem-solving process step-by-step, allowing them to reveal hints or next steps on demand. This fosters active learning and mimics the guidance of a real teacher. Advanced functionality will include overlaying visual hints directly onto the webpage.

## 2. Core Features

*   **Problem Extraction:** Automatically read the problem description from the active LeetCode tab.
*   **Step-by-Step Guidance:** Use an AI model to generate a sequence of hints or steps.
*   **Interactive UI:** A popup interface where the user can request the first step, subsequent steps, or reset the process.
*   **State Management:** The extension will remember the current problem and the user's progress through the steps.
*   **(Advanced) On-Screen Overlay:** Inject a canvas or HTML elements onto the page to draw diagrams or highlight specific parts of the code editor or problem description.

## 3. Technology Stack & Setup

| Component           | Technology                                                              | Setup                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Scaffolding**     | [Vite](https://vitejs.dev/) with a Vanilla JS/TS template               | `npm create vite@latest my-chrome-extension --template vanilla-ts`                                                               |
| **Frontend**        | HTML, CSS, TypeScript                                                   | Comes standard with the Vite template.                                                                                           |
| **AI Integration**  | [Gemini API](https://ai.google.dev/)                                    | You will need to sign up for an API key. The API calls will be made from the extension's background script or popup script. |
| **On-Screen Drawing** | HTML Canvas API                                                         | Injected into the target webpage via a content script.                                                                           |
| **Packaging**       | `vite build`                                                            | Configured in `vite.config.ts` to produce the final extension files in a `dist` directory.                                       |

---

## 4. Step-by-Step Implementation Plan

### Step 1: Basic Extension Setup

1.  **Scaffold the Project:**
    *   Run `npm create vite@latest leetcode-tutor --template vanilla-ts`
    *   `cd leetcode-tutor`
    *   `npm install`

2.  **Create `manifest.json`:** This is the core configuration file for any Chrome extension. Create it in your project's root directory.

    ```json
    {
      "manifest_version": 3,
      "name": "AI LeetCode Tutor",
      "version": "1.0",
      "description": "Step-by-step guidance for solving algorithm problems.",
      "permissions": [
        "activeTab",
        "scripting",
        "storage"
      ],
      "host_permissions": [
        "https://generativelanguage.googleapis.com/"
      ],
      "action": {
        "default_popup": "index.html"
      },
      "background": {
        "service_worker": "src/background.ts"
      },
      "content_scripts": [
        {
          "matches": ["https://leetcode.com/problems/*"],
          "js": ["src/content.ts"]
        }
      ]
    }
    ```

3.  **Configure Vite:** Modify `vite.config.ts` to handle the multiple entry points (`background.ts`, `content.ts`).

### Step 2: Problem Extraction (Content Script)

The **content script** is the only part of your extension that can directly access and read the content of the webpage.

1.  **`src/content.ts`:**
    *   This script will be injected into LeetCode problem pages.
    *   It needs to identify the DOM elements containing the problem title and description. Use your browser's developer tools to find the correct selectors.
    *   It will listen for messages from the popup script. When it receives a "getProblem" message, it will scrape the text and send it back.

    ```typescript
    // src/content.ts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "GET_PROBLEM_DETAILS") {
        const problemTitle = document.querySelector('.mr-2.text-label-1')?.textContent;
        const problemDescription = document.querySelector('.elfjS')?.textContent;
        sendResponse({ title: problemTitle, description: problemDescription });
      }
    });
    ```

### Step 3: The User Interface (Popup)

This is the main interface for the user, built with HTML, CSS, and TypeScript.

1.  **`index.html` (the popup):**
    *   Create buttons: "Start Tutorial", "Next Step", "Reset".
    *   Create a `div` to display the AI-generated steps.

2.  **`src/main.ts` (popup script):**
    *   **On "Start Tutorial" click:**
        *   Send a message to the content script (`content.ts`) to get the problem details.
        *   Receive the problem details.
        *   Make the initial API call to the Gemini API with a carefully crafted prompt.
    *   **On "Next Step" click:**
        *   Make another API call, but this time include the context of the previous steps to get the *next* logical hint.
    *   **State:** Store the conversation history (problem + steps revealed so far) in `chrome.storage.local` to maintain state.

### Step 4: AI Integration (Background or Popup Script)

This is where the "teaching" happens. The quality of your prompts is critical.

1.  **`src/background.ts` or `src/main.ts`:**
    *   Define a function `getAiHint(problem, history)`.
    *   This function will make a `fetch` request to the Gemini API endpoint.
    *   **Crucial - The Prompt:** Your prompt must instruct the AI to behave like a tutor.

    **Example Initial Prompt:**
    ```
    You are an expert algorithm tutor. A student has given you the following LeetCode problem. Provide only the very first conceptual step or hint to get them started. Do not give away the full solution or write any code.

    Problem:
    """
    {problem_description_from_content_script}
    """
    ```

    **Example Follow-up Prompt:**
    ```
    You are an expert algorithm tutor. The student has received the following hints so far:

    History:
    """
    {previous_hints_from_state}
    """

    Based on this history, provide the very next small, conceptual step. Do not repeat previous steps. Do not give away the full solution or write any code.
    ```

### Step 5: On-Screen Drawing (Advanced)

This feature provides a superior user experience by visually connecting hints to the problem itself.

1.  **Modify `content.ts`:**
    *   Add a listener for a new message type, e.g., `DRAW_HINT`.
    *   The message payload from the AI should contain instructions, e.g., `{ type: 'arrow', from: '#line5', to: '#line8' }` or `{ type: 'highlight', selector: '.for-loop' }`.
    *   When this message is received, create an HTML `<canvas>` element.
    *   Style the canvas to overlay the page content (`position: absolute`, high `z-index`, `pointer-events: none`).
    *   Use the Canvas API (`getContext('2d')`) to draw the shapes, arrows, or highlights as instructed. This will require calculating the coordinates of the target DOM elements.

## 5. Development Workflow

1.  **Run Vite:** In your terminal, run `npm run dev`. This will watch for file changes.
2.  **Load Extension in Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode".
    *   Click "Load unpacked" and select your project's `dist` directory (Vite will create this).
3.  **Test:** Navigate to a LeetCode problem, open the extension popup, and test the functionality. Use `console.log` in your scripts and view the output in the extension's service worker console or the popup's inspect view.
4.  **Iterate:** Modify your code, and Vite will automatically rebuild. Click the "reload" button for your extension in `chrome://extensions` to see the changes.

