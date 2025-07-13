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
    sendResponse({ title: problemTitle, description: problemDescription });
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
