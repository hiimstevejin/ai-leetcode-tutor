import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";
import mainViewHtml from "./views/main-view.html?raw";
import settingsViewHtml from "./views/settings-view.html?raw";
import fullSolutionViewHtml from "./views/fullsolution-view.html?raw";
import { sendAiRequest } from "./utils/llm";
import { generateHintPrompt } from "./utils/prompt";

const appContainer = document.querySelector<HTMLDivElement>("#app-container");

let hints: string[] = [];
let solution: string = "";
let currentHintIndex = 0;
let problemTitle = "";

function showMainView() {
  if (!appContainer) return;
  appContainer.innerHTML = mainViewHtml;

  const getHintBtn = document.querySelector<HTMLButtonElement>("#hintBtn");
  const nextHintBtn = document.querySelector<HTMLButtonElement>("#nextHintBtn");
  const solutionBtn = document.querySelector<HTMLButtonElement>("#solutionBtn");

  getHintBtn?.addEventListener("click", handleGetHint);
  nextHintBtn?.addEventListener("click", handleNextHint);
  solutionBtn?.addEventListener("click", () => showSolutionView(solution));

  const goToSettingsBtn =
    document.querySelector<HTMLButtonElement>("#settingsBtn");
  goToSettingsBtn?.addEventListener("click", showSettingsView);

  // Load state on view load
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab?.url) return;
    const problemUrl = activeTab.url;

    chrome.storage.local.get(problemUrl, (result) => {
      const savedState = result[problemUrl];
      if (savedState) {
        hints = savedState.hints;
        solution = savedState.solution;
        currentHintIndex = savedState.currentHintIndex;
        problemTitle = savedState.problemTitle;
        updateUiFromState();
      }
    });
  });
}

function updateUiFromState() {
  const getHintBtn = document.querySelector<HTMLButtonElement>("#hintBtn");
  const nextHintBtn = document.querySelector<HTMLButtonElement>("#nextHintBtn");
  const solutionBtn = document.querySelector<HTMLButtonElement>("#solutionBtn");

  if (hints.length > 0) {
    displayHint();
    getHintBtn?.classList.add("d-none");
    solutionBtn?.classList.remove("d-none");
    if (currentHintIndex < hints.length - 1) {
      nextHintBtn?.classList.remove("d-none");
    } else {
      nextHintBtn?.classList.add("d-none");
    }
  }
}

function saveState(problemUrl: string) {
  const state = {
    hints,
    solution,
    currentHintIndex,
    problemTitle,
  };
  chrome.storage.local.set({ [problemUrl]: state });
}

function handleGetHint() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    if (!activeTab?.id || !activeTab.url) return;
    const problemUrl = activeTab.url;

    chrome.tabs.sendMessage(
      activeTab.id,
      { type: "GET_PROBLEM_DETAILS" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }
        console.log(response)
        const { title, description, codingLanguage } = response || {};
        // save to global state
        problemTitle = title;
        // get API KEY from sync storage
        chrome.storage.sync.get(["LLM_API_KEY"], (result) => {
          const apiKey = result["LLM_API_KEY"];
          if (!apiKey) {
            console.warn("Missing LLM API Key");
            return;
          }
          //Send API request to gemini
          const userPrompt = generateHintPrompt(
            title,
            description,
            codingLanguage
          );
          sendAiRequest(apiKey, userPrompt).then((result) => {
            if (result) {
              hints = result.hints;
              solution = result.solution;
              currentHintIndex = 0;
              saveState(problemUrl);
              updateUiFromState();
            } else {
              console.warn("No hints or solution received from AI.");
            }
          });
        });
      }
    );

    chrome.tabs.sendMessage(
      activeTab.id,
      { type: "HIGHLIGHT_PROBLEM" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }
        console.log("Highlighting status:", response);
      }
    );
  });
}

function displayHint() {
  const hintContainer =
    document.querySelector<HTMLDivElement>("#hint-container");
  if (hintContainer && hints.length > 0) {
    hintContainer.classList.add("formatted-text");
    hintContainer.textContent = hints[currentHintIndex];
  }
}

function handleNextHint() {
  currentHintIndex++;
  displayHint();
  if (currentHintIndex >= hints.length - 1) {
    const nextHintBtn =
      document.querySelector<HTMLButtonElement>("#nextHintBtn");
    nextHintBtn?.classList.add("d-none");
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab?.url) return;
    saveState(activeTab.url);
  });
}

function showSolutionView(solution: string) {
  if (!appContainer) return;
  appContainer.innerHTML = fullSolutionViewHtml;

  const solutionText = document.querySelector<HTMLParagraphElement>(
    "#full-solution-text"
  );
  if (solutionText) {
    solutionText.classList.add("formatted-text");
    solutionText.textContent = solution;
  }

  const backBtn = document.querySelector<HTMLButtonElement>(
    "#back-to-main-view-from-solution"
  );
  backBtn?.addEventListener("click", showMainView);

  const copyBtn =
    document.querySelector<HTMLButtonElement>("#copy-code-button");
  copyBtn?.addEventListener("click", () => handleCopyCode(solution));

  const injectBtn = document.querySelector<HTMLButtonElement>(
    "#inject-code-button"
  );
  injectBtn?.addEventListener("click", () => handleInjectCode(solution));

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab?.url) return;
    chrome.storage.local.remove(activeTab.url);
  });
}

function handleCopyCode(code: string) {
  const codeWithoutTicks = code.replace(/```/g, "").replace(/^[a-zA-Z]+\n/, "");
  console.log(codeWithoutTicks);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab?.id) return;
    chrome.tabs.sendMessage(
      activeTab.id,
      { type: "COPY_CODE", code: codeWithoutTicks },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        console.log("Copy status:", response.status);
      }
    );
  });
}

function handleInjectCode(code: string) {
  const codeWithoutTicks = code.replace(/```/g, "").replace(/^[a-zA-Z]+\n/, "");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab?.id) return;
    chrome.tabs.sendMessage(
      activeTab.id,
      { type: "INJECT_CODE", code: codeWithoutTicks },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        console.log("Inject status:", response.status);
      }
    );
  });
}

function showSettingsView() {
  if (!appContainer) return;
  appContainer.innerHTML = settingsViewHtml;

  const goBackBtn = document.querySelector<HTMLButtonElement>("#gobackBtn");
  goBackBtn?.addEventListener("click", showMainView);

  const apiKeyInput = document.querySelector<HTMLInputElement>("#apiKeyInput");
  const apiKeySubmitButton =
    document.querySelector<HTMLButtonElement>("#submitApiKey");

  chrome.storage.sync.get(["LLM_API_KEY"], (result) => {
    if (apiKeyInput && result["LLM_API_KEY"]) {
      apiKeyInput.value = result["LLM_API_KEY"];
    }
  });

  function handleApiKeySubmit() {
    if (apiKeyInput?.value) {
      chrome.storage.sync.set({ LLM_API_KEY: apiKeyInput.value }, function () {
        console.log("LLM_API_KEY Saved to sync storage successfully");
      });

      apiKeyInput.value = "";

      const successAlert = document.createElement("div");
      successAlert.className =
        "alert alert-success alert-dismissible fade show";
      successAlert.role = "alert";
      successAlert.innerHTML = "API Key has been saved successfully!";

      const container = document.querySelector(".container");
      if (container) {
        container.prepend(successAlert);

        setTimeout(() => {
          successAlert.classList.remove("show");
          successAlert.addEventListener("transitionend", () => {
            successAlert.remove();
          });
        }, 2000);
      }
    }
  }

  // event handle for click or enter to submit api key
  apiKeySubmitButton?.addEventListener("click", handleApiKeySubmit);
  apiKeyInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleApiKeySubmit();
    }
  });
}

showMainView();