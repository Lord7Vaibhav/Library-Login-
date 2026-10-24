(() => {
  const $ = (id) => document.getElementById(id);

  // Shared object: baaki files (auth.js, logs.js, sheets.js) isi se judti hain
  const Lib = (window.Lib = {
    $,
    mode: "signin",                 // signin | signup
    handlers: {},                   // backend functions yahan register honge
    hooks: { afterLogin: [] }       // login ke baad chalne wale kaam
  });

  /* ---------- Helpers ---------- */
  Lib.toast = (msg, type = "") => {
    const t = $("toast");
    t.textContent = msg;
    t.className = "show " + type;
    clearTimeout(Lib.toast._t);
    Lib.toast._t = setTimeout(() => (t.className = ""), 3800);
  };
  Lib.busy = (btn, on) => {
    btn.disabled = on;
    btn.classList.toggle("loading", on);
  };
  Lib.validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  Lib.cardNo = (user) => "LIB-" + user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  Lib.once = async (key, fn) => {   // ek login session mein ek kaam sirf ek baar
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    await fn();
  };
  const demo = () => Lib.toast("Demo mode", "success");

  /* ---------- Tabs (Password / Email OTP) ---------- */
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const isPw = tab.dataset.tab === "password";
      $("passwordForm").hidden = !isPw;
      $("otpForm").hidden = isPw;
    })
  );

  /* ---------- Sign in <-> Sign up ---------- */
  $("switchMode").addEventListener("click", (e) => {
    e.preventDefault();
    Lib.mode = Lib.mode === "signin" ? "signup" : "signin";
    const up = Lib.mode === "signup";
    $("nameField").hidden = !up;
    $("title").textContent = up ? "Get your library card" : "Welcome back, reader";
    $("subtitle").textContent = up ? "Join PageTurner in under a minute" : "Sign in to open your library account";
    $("passwordBtn").textContent = up ? "Sign up" : "Sign in";
    $("switchText").textContent = up ? "Already a member?" : "New to the library?";
    $("switchMode").textContent = up ? "Sign in" : "Get a library card";
    $("pPass").autocomplete = up ? "new-password" : "current-password";
  });

  $("togglePw").addEventListener("click", () => {
    const p = $("pPass");
    p.type = p.type === "password" ? "text" : "password";
  });

  /* ---------- Password form ---------- */
  $("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("pEmail").value.trim();
    const password = $("pPass").value;
    const name = $("name").value.trim();

    if (!Lib.validEmail(email)) return Lib.toast("Please enter a valid email", "error");
    if (password.length < 6) return Lib.toast("Password must be at least 6 characters", "error");
    if (Lib.mode === "signup" && !name) return Lib.toast("Please enter your name", "error");
    if (!Lib.handlers.password) return demo();

    const btn = $("passwordBtn");
    Lib.busy(btn, true);
    try { await Lib.handlers.password({ mode: Lib.mode, email, password, name }); }
    finally { Lib.busy(btn, false); }
  });

  /* ---------- Email OTP form ---------- */
  let otpSent = false;

  async function sendOtp() {
    const email = $("oEmail").value.trim();
    if (!Lib.validEmail(email)) return Lib.toast("Please enter a valid email", "error");
    if (!Lib.handlers.otpSend) return demo();

    const btn = $("otpBtn");
    Lib.busy(btn, true);
    const ok = await Lib.handlers.otpSend(email);
    Lib.busy(btn, false);
    if (!ok) return;

    otpSent = true;
    $("codeField").hidden = false;
    $("resendRow").hidden = false;
    $("oEmail").readOnly = true;
    btn.textContent = "Verify & Sign in";
    $("oCode").focus();
  }

  $("otpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!otpSent) return sendOtp();
    const email = $("oEmail").value.trim();
    const token = $("oCode").value.trim();
    if (token.length < 6) return Lib.toast("Enter the code from your email", "error");

    const btn = $("otpBtn");
    Lib.busy(btn, true);
    try { await Lib.handlers.otpVerify(email, token); }
    finally { Lib.busy(btn, false); }
  });

  $("resendOtp").addEventListener("click", (e) => { e.preventDefault(); sendOtp(); });

  /* ---------- Google ---------- */
  $("googleBtn").addEventListener("click", async () => {
    if (!Lib.handlers.google) return demo();
    await Lib.handlers.google();
  });

  /* ---------- Dashboard tiles + logout ---------- */
  document.querySelectorAll(".tile").forEach((t) =>
    t.addEventListener("click", () => Lib.toast(t.dataset.name + ": coming soon 📚"))
  );

  $("logoutBtn").addEventListener("click", async () => {
    if (Lib.handlers.logout) await Lib.handlers.logout();
    else Lib.render(null);
  });

  /* ---------- Login ke baad dashboard dikhana ---------- */
  Lib.render = async (session) => {
    const loggedIn = !!session;
    $("authView").hidden = loggedIn;
    $("dashView").hidden = !loggedIn;
    if (!loggedIn) return;

    const user = session.user;
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email.split("@")[0];

    $("avatar").textContent = name.charAt(0).toUpperCase();
    $("welcome").textContent = "Hi, " + name;
    $("userEmail").textContent = user.email;
    $("cardNo").textContent = Lib.cardNo(user);
    $("methodChip").textContent =
      "via " + (sessionStorage.getItem("method") || user.app_metadata?.provider || "—");

    for (const fn of Lib.hooks.afterLogin) {
      try { await fn(user); } catch (err) { console.error(err); }
    }
  };
})();