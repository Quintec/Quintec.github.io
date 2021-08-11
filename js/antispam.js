let e = document.getElementById("email");
e.addEventListener("click", function() {
  let r = "dhvagrx55555tznvypbz";
  let a = 11, d = 16, b = "a".charCodeAt(0);
  let f = "";
  for (var i = 0; i < r.length; i++) {
    if (i > 6 && i < 12) {
      f += r.charAt(i);
    } else {
      f += String.fromCharCode(((r.charCodeAt(i) - b + 13) % 26) + b);
    }
    if (i == a) {
      f += "@";
    } else if (i == d) {
      f += ".";
    }
  }
  e.textContent = f;
});