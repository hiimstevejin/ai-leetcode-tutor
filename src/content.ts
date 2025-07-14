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
    if (problemDescriptionElement) {
      problemDescriptionElement.classList.add("scanning-highlight-effect");
      // Remove the class after the animation completes
      setTimeout(() => {
        problemDescriptionElement.classList.remove("scanning-highlight-effect");
      }, 2000); // 1.5 seconds, matching the animation duration
    }
    sendResponse({ status: "highlighting done" });
  }
});
