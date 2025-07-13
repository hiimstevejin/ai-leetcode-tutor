import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";
import mainViewHtml from "./views/main-view.html?raw";
import settingsViewHtml from "./views/settings-view.html?raw";
import { sendAiRequest } from "./utils/llm";
import { generateHintPrompt } from "./utils/prompt";

const appContainer = document.querySelector<HTMLDivElement>("#app-container");

let hints: string[] = [];
let solution: string = "";

function showMainView() {
  if (!appContainer) return;
  appContainer.innerHTML = mainViewHtml;
  const getHintBtn = document.querySelector<HTMLButtonElement>("#hintBtn");
  getHintBtn?.addEventListener("click", handleGetHint);

  const goToSettingsBtn =
    document.querySelector<HTMLButtonElement>("#settingsBtn");
  goToSettingsBtn?.addEventListener("click", showSettingsView);

  function handleGetHint() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (!activeTab?.id) return;

      chrome.tabs.sendMessage(
        activeTab.id,
        { type: "GET_PROBLEM_DETAILS" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
          }

          const { title, description } = response || {};
          chrome.storage.sync.get(["LLM_API_KEY"], (result) => {
            const apiKey = result["LLM_API_KEY"];
            if (!apiKey) {
              console.warn("Missing LLM API Key");
              return;
            }

            const userPrompt = generateHintPrompt(title, description);
            sendAiRequest(apiKey, userPrompt).then((result) => {
              if (result) {
                hints = result.hints
                solution = result.solution
                console.log("Hints Array:", hints);
                console.log("Solution String:", solution);
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
