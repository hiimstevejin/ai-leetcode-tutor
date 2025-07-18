// Inject the CSS for the highlight effect
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = chrome.runtime.getURL("style/effect.css");
document.head.appendChild(link);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "GET_PROBLEM_DETAILS") {
    const problemTitle =
      document.querySelector(".text-title-large")?.textContent;
    const problemDescription = document.querySelector(".elfjS")?.textContent;

    // extract the language user selected on leetcode problem editor
    const langButton = Array.from(
      document.querySelectorAll('button[aria-haspopup="dialog"]')
    ).find((btn) =>
      btn.textContent
        ?.trim()
        ?.match(
          /^(C\+\+|Java|Python3?|C#|JavaScript|TypeScript|PHP|Swift|Kotlin|Dart|Go|Ruby|Scala|Rust|Racket|Erlang|Elixir)/
        )
    );

    let problemCodingLanguage = "";

    if (langButton) {
      const textNode = Array.from(langButton.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
      );
      problemCodingLanguage = textNode?.textContent?.trim() || "Python3"; // If Failed fall back on python3
      console.log("Selected language:", problemCodingLanguage);
    } else {
      console.warn("Language selector button not found");
    }

    sendResponse({
      title: problemTitle,
      description: problemDescription,
      codingLanguage: problemCodingLanguage,
    });
  } else if (request.type === "HIGHLIGHT_PROBLEM") {
    const problemDescriptionElement = document.querySelector(".elfjS");
    const codeEditorElement = document.querySelector(
      ".view-lines.monaco-mouse-cursor-text"
    );

    if (problemDescriptionElement) {
      // Start first highlight immediately
      problemDescriptionElement.classList.add("scanning-highlight-effect");

      // Remove it after 2 seconds
      setTimeout(() => {
        problemDescriptionElement.classList.remove("scanning-highlight-effect");
      }, 2000);
    }

    if (codeEditorElement) {
      // Start second highlight 1 second later
      setTimeout(() => {
        codeEditorElement.classList.add("scanning-highlight-effect");

        // Remove it 1 second after it starts (i.e., at the same time as the first one ends)
        setTimeout(() => {
          codeEditorElement.classList.remove("scanning-highlight-effect");
        }, 1000);
      }, 1000);
    }

    sendResponse({ status: "highlighting done" });
  } else if (request.type === "COPY_CODE") {
    const code = request.code;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        sendResponse({ status: "copied" });
      })
      .catch((err) => {
        console.error("Failed to copy code: ", err);
        sendResponse({ status: "failed" });
      });
    return true; // async response
  } else if (request.type === "INJECT_CODE") {
    const codeToInject = request.code;
    const script = document.createElement("script");
    script.textContent = `
        if (window.monaco && typeof window.monaco.editor.getModels === 'function' && window.monaco.editor.getModels().length > 0) {
            window.monaco.editor.getModels()[0].setValue(${JSON.stringify(
              codeToInject
            )});
        } else {
            console.error("AI LeetCode Tutor: Monaco editor instance not found.");
        }
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    sendResponse({ status: "injected" });
    return true;
  }
});
