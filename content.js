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
  // inject UI here
  // setTimeout(setUpButtons, 1000); // only problem is that this can be called twice if not intialized quickly
  setUpButtons(); // while this gets called a little to fast lol

  // const videoElements = [...document.querySelectorAll("ytd-video-renderer")];
  // let videoElements;
  // setTimeout(() => {
  //   videoElements = document.querySelectorAll("ytd-video-renderer");
  //   console.log("videoElements", videoElements.length);
  // }, 2000);
  waitForVideos((videos) => {
    console.log("STABLE video count:", videos.length);
  });
  // grab current videos.
}

function handleRouteChange() {
  if (isChannelSearchPage()) {
    onChannelSearchPage();
  } else {
    console.log("not a search page");
  }
}

handleRouteChange(); // initial load, first time we load up any youtube links, whether homepage or channel search

window.addEventListener("yt-navigate-finish", () => {
  console.log("yt navigate finish ", location.href);
  handleRouteChange();
});

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // onUrlChange();
    console.log("url changed, coming from MutationObserver");

    handleRouteChange(); // everytime we land on a channel search query.
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

function setUpButtons() {
  const container = createContainer();
  // const videoContainer = document.querySelector(
  //   "ytd-two-column-browse-results-renderer",
  // );

  // first element is disabled
  const videoContainer = [
    ...document.querySelectorAll("ytd-two-column-browse-results-renderer"),
  ];
  if (videoContainer.length === 0) {
    console.log("no video container");
    return;
  }
  console.log("videoContainer", videoContainer[0]);
  let primaryContainer = videoContainer[0].firstElementChild;
  primaryContainer.insertBefore(container, primaryContainer.firstChild);
  console.log("setup complete");
}

function createContainer() {
  // Host element (lives in YouTube DOM)
  const host = document.createElement("div");
  host.id = "yt-channel-sort-ui";

  // Shadow root (isolated)
  const shadow = host.attachShadow({ mode: "open" });

  // Styles (moved from style.css)
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      font-family: Roboto, Arial, sans-serif;
    }

    .button-container {
      display: flex;
      gap: 8px;
      background-color: #0f0f0f;
      padding: 8px;
      border-radius: 8px;
      width: fit-content;
    }

    .sort-button {
      all: unset;
      font-family: Roboto, Arial, sans-serif;
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
      letter-spacing: 0;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      background-color: #272727;
      color: #f1f1f1;
    }

    .sort-button:hover {
      background-color: #3f3f3f;
    }

    .sort-button.active {
      background-color: #f1f1f1;
      color: #0f0f0f;
    }

    .sort-button.active:hover {
      background-color: #e5e5e5;
    }
  `;

  // Container
  const container = document.createElement("div");
  container.className = "button-container";

  // Buttons
  const defaultBtn = createButton("Default", true, shadow);
  const latestBtn = createButton("Latest", false, shadow);
  const popularBtn = createButton("Popular", false, shadow);
  const oldestBtn = createButton("Oldest", false, shadow);

  container.append(defaultBtn, latestBtn, popularBtn, oldestBtn);

  // Attach to shadow root
  shadow.append(style, container);

  return host;
}

function createButton(name, isActive = false, shadowRoot) {
  const btn = document.createElement("button");
  btn.textContent = name;
  btn.className = "sort-button";

  if (isActive) {
    btn.classList.add("active");
  }

  btn.addEventListener("click", () => {
    // ONLY query inside this shadow root
    const allButtons = shadowRoot.querySelectorAll(".sort-button");
    allButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });

  return btn;
}
function waitForVideos(callback) {
  const container = document.querySelector("ytd-section-list-renderer");
  if (!container) return;
  const videoList = container.querySelector("#contents");
  console.log("MutationObserver: ", videoList);

  let block = 26;
  // it's intially 26 then increments by 30 but what if we are left with only 20 or < our length like the last x

  const observer = new MutationObserver(() => {
    const videos = container.querySelectorAll("ytd-video-renderer");

    if (videos.length >= block) {
      // observer.disconnect();
      block += 30;
      callback(videos);
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}
