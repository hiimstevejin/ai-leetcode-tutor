import "./style.css";
import mainViewHtml from "./views/main-view.html?raw";
import settingsViewHtml from "./views/settings-view.html?raw";

const appContainer = document.querySelector<HTMLDivElement>("#app-container");

function showMainView() {
  if (!appContainer) return;
  appContainer.innerHTML = mainViewHtml;

  const goToSettingsBtn = document.querySelector<HTMLButtonElement>(
    "#settingsBtn"
  );
  goToSettingsBtn?.addEventListener("click", showSettingsView);
}

function showSettingsView(){
  if(!appContainer) return;
  appContainer.innerHTML = settingsViewHtml;

  const goBackBtn = document.querySelector<HTMLButtonElement>('#go-back-btn');
  goBackBtn?.addEventListener('click',showMainView);
}

showMainView();