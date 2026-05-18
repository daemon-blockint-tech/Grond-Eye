(function () {
  try {
    var theme =
      localStorage.getItem("grond-theme") ||
      localStorage.getItem("wwv-theme") ||
      "black";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "black");
  }
})();
