document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    registerEvents();

    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    document.getElementById("canvasBtn1")?.addEventListener("click", genericTest)
}
function genericTest() {
    alert("this is a test")
}


