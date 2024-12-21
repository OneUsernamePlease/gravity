"use strict";
document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
    registerEvents();
    document.removeEventListener("DOMContentLoaded", initialize);
}
function registerEvents() {
    var _a;
    (_a = document.getElementById("canvasBtn1")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", genericTest);
}
function genericTest() {
    alert("this is a test");
}
