export function initScroll() {

  const main = document.getElementById("main");
  const scrollBtn = document.getElementById("scrollDownBtn");

  function isNearBottom(threshold = 200) {
    return main.scrollHeight - main.scrollTop - main.clientHeight < threshold;
  }

  function scrollToBottom() {
    main.scrollTo({
      top: main.scrollHeight,
      behavior: "smooth"
    });
  }

  scrollBtn.onclick = scrollToBottom;

  main.addEventListener("scroll", () => {
    if (isNearBottom(120)) scrollBtn.classList.remove("show");
    else scrollBtn.classList.add("show");
  });
}
