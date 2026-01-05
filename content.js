// TODO:
// [ ] v1: Sort the list then resort when we get another section .
// [ ] v1-1: scroll down to get full list then sort
// [ ] v2: fetch the full list and then sort

let originalOrder = [];
let VIDEO_LIST = [];
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
    console.log("vidoes: ", videos);
    console.dir(videos[0]);

    // update original order , but watch out for duplicates.
    originalOrder = originalOrder.concat(videos);
    VIDEO_LIST = [...videos].map((v) => extractVideoData(v));
    console.log("completed video data list: ", VIDEO_LIST);
  });
  // grab current videos.
  // video info is in vidoeELment => first child => 2nd child => first child => 2nd child => first child => second child
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

  btn.addEventListener("click", () => sortVideos(name));
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

// video info is in vidoeELment => first child => 2nd child => first child => 2nd child => first child => second child
function extractVideoData(el) {
  // console.log(el);
  // every video should have views and date , except playlist which we will throw out

  // let data =
  //   el.firstChild?.children?.[1]?.firstChild?.children?.[1]?.firstChild
  //     ?.children?.[1];
  let first = el.firstElementChild;
  let second = first.children[1];
  let third = second.firstElementChild;
  let fourth = third.children[1];
  let fifth = fourth.firstElementChild;
  let sixth = fifth.children[1];
  let dataNode = sixth.querySelectorAll("span");
  let views = convertViews(dataNode[0].innerText);
  let date = convertDate(dataNode[1].innerText);
  // console.log(views, date);

  // either query select the data I want to check each child for the element one by one
  // just return nothing
  // console.log(data);
  // Maybe sort by title or duration in the future?
  //asdfadsf
  return {
    el,
    views,
    date,
  };
}

function convertDate(date) {
  // videos will have x years, x months, x days, x hours ago, x minutes ago , x seconds
  let string = date.split("ago");
  let value = string[0].trim().split(" ");
  let numberVariable = value[0];
  let timeVariable = value[1];

  let today = new Date();
  let convertedTime = new Date(today);
  // let functionMap = {
  //   "years": today.getFullYear,
  //   "months": today.getMonth,
  //   "days": today.getDate,
  //   "hours": today.getHours,
  //   "seconds": today.getSeconds,
  // }
  // if (functionMap.hasOwn(timeVariable)){
  //   convertedTime =
  // }
  switch (timeVariable) {
    case "years":
      convertedTime.setFullYear(today.getFullYear() - numberVariable);
      break;
    case "months":
      convertedTime.setMonth(today.getMonth() - numberVariable);
      break;
    case "days":
      convertedTime.setDate(today.getDate() - numberVariable);
      break;
    case "hours":
      convertedTime.setHours(today.getHours() - numberVariable);
      break;
    case "minutes":
      convertedTime.setMinutes(today.getMinutes() - numberVariable);
      break;
    case "seconds":
      convertedTime.setSeconds(today.getSeconds() - numberVariable);
      break;
    default:
      console.log("no time");
  }
  return convertedTime;
}
function convertViews(view) {
  // B = billion, M = million, K = thousands, nothig = under 1000
  if (!view.includes("views")) return number(view);
  let string = view.split("views")[0].trim();
  let stringVariable = string.slice(-1);
  let numberVariable = string.slice(0, -1);

  switch (stringVariable) {
    case "B":
      return numberVariable * 1000000000;
    case "M":
      return numberVariable * 1000000;
    case "K":
      return numberVariable * 1000;
    default:
      return numberVariable;
  }
}

function sortVideos(type) {
  console.log("type: ", type);
  let sorted;
  switch (type) {
    case "Popular":
      sorted = VIDEO_LIST.sort((a, b) => b.views - a.views);
      break;
    case "Oldest":
      sorted = VIDEO_LIST.sort((a, b) => b.date - a.date);
      break;
    case "Latest":
      sorted = VIDEO_LIST.sort((a, b) => a.date - b.date);
      break;
    case "Default":
      restoreOriginalOrder();
      return;
  }
  console.log("sorted: ", sorted);
  console.log("VIDEO_LIST", VIDEO_LIST);
  applyOrder(sorted);
}

function applyOrder(sortedVideos) {
  if (!Array.isArray(sortedVideos)) {
    console.error("sortedVideos is not an array:", sortedVideos);
    return;
  }
  console.log(sortedVideos);
  const videoContainer = [
    ...document.querySelectorAll("ytd-two-column-browse-results-renderer"),
  ];
  let primaryContainer = videoContainer[0].firstElementChild;
  sortedVideos.forEach((video) => {
    primaryContainer.appendChild(video.el);
  });
}
