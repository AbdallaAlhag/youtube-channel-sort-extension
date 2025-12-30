let lastUrl = location.href;
console.log("content script loaded");

function isChannelSearchPage() {
  console.log(location.pathname);
  return (
    location.pathname.startsWith("/@") && location.pathname.endsWith("/search")
  );
}

function onChannelSearchPage() {
  if (document.querySelector("#yt-channel-sort-ui")) {
    console.log("button already appended");
    return;
  }

  console.log("Channel search page detected");
  // const videoContainer = document.querySelector("ytd-grid-renderer");
  const videoContainer = document.querySelector(
    "ytd-two-column-browse-results-renderer",
  );
  const videoElements = [...document.querySelectorAll("ytd-video-renderer")];
  // parent element of invidial video elemnts = div.id= "contents"

  setUpButtons();
  // inject UI here
}

function handleRouteChange() {
  if (isChannelSearchPage()) {
    onChannelSearchPage();
  } else {
    console.log("not a search page");
  }
}

handleRouteChange(); // initial load, first time we load up any youtube links, whether homepage or channel search

window.addEventListener("yt-navigate-finish", handleRouteChange);

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // onUrlChange();
    console.log("url changed");

    handleRouteChange(); // everytime we land on a channel search query.
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function createButton(name) {
  const btn = document.createElement("button");
  btn.innerHTML = name;
  btn.style.fontFamily = "Roboto, Arial, sans-serif";
  btn.style.fontSize = "14px";
  btn.style.lineHeight = "20px";
  btn.style.fontWeight = "500";
  btn.style.letterSpacing = "normal";
  btn.style.textColor = "#0f0f0f";
  btn.style.backgroundColor = "#f1f1f1";
  btn.style.borderRadius;
  return btn;
}

function setUpButtons() {
  let latestBtn = createButton("Latest");
  let popularBtn = createButton("Popular");
  let oldestBtn = createButton("Oldest");

  let container = createContainer();
  container.appendChild(latestBtn);
  container.appendChild(popularBtn);
  container.appendChild(oldestBtn);
  // const videoContainer = document.querySelector(
  //   "ytd-two-column-browse-results-renderer",
  // );

  // first element is disabled
  const videoContainer = [
    ...document.querySelectorAll("ytd-two-column-browse-results-renderer"),
  ];
  if (!videoContainer) return;
  console.log("videoContainer", videoContainer);
  videoContainer.insertBefore(container, videoContainer.firstChild);
  console.log("setup complete");
}

function createContainer() {
  const container = document.createElement("div");
  container.id = "yt-channel-sort-ui";
  container.style.fontFamily = "Roboto, Arial, sans-serif";
  container.style.fontSize = "10px";
  container.style.lineHeight = "normal";
  container.style.fontWeight = "400";
  container.style.letterSpacing = "normal";
  container.style.textColor = "#000000";
  container.style.backgroundColor = "#0f0f0f";
  return container;
}
