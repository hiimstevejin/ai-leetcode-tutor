import "./style.css";
import mainViewHtml from "./views/main-view.html?raw";
import settingsViewHtml from "./views/settings-view.html?raw";

const appContainer = document.querySelector<HTMLDivElement>("#app-container");

function showMainView() {
  if (!appContainer) return;
  appContainer.innerHTML = mainViewHtml;

  const goToSettingsBtn =
    document.querySelector<HTMLButtonElement>("#settingsBtn");
  goToSettingsBtn?.addEventListener("click", showSettingsView);
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
    const apiKey = apiKeyInput?.value;
    if (apiKeyInput) {
      chrome.storage.sync.set({ LLM_API_KEY: apiKey }, function () {
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

