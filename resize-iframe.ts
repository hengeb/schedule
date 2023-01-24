export function sendResizeMessage() {
  const contentContainer = document.querySelector(".content");
  const style = window.getComputedStyle(
    contentContainer ? contentContainer : document.querySelector("body")
  );

  window.parent.postMessage(
    {
      name: "setHeight",
      height:
        parseInt(style.height) +
        parseInt(style.marginTop) +
        parseInt(style.marginBottom),
      origin: location.toString(),
    },
    "*"
  );
}
window.addEventListener("resize", sendResizeMessage);
window.addEventListener("load", sendResizeMessage);
