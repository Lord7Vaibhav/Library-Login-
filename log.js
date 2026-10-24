(() => {
  const Lib = window.Lib;
  const sb = Lib.sb;

  /* INSERT: login record save karna */
  async function recordLogin(user) {
    const method = sessionStorage.getItem("method") || user.app_metadata?.provider || "unknown";
    const { error } = await sb.from("library_logins").insert({ email: user.email, method });
    if (error) console.error("DB insert failed:", error.message);
  }

  /* SELECT: last 5 logins dikhana */
  async function loadLogs() {
    const { data, error } = await sb
      .from("library_logins")
      .select("method,created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const list = Lib.$("logList");
    list.replaceChildren();

    if (error || !data || !data.length) {
      const li = document.createElement("li");
      li.textContent = "No activity yet";
      return list.appendChild(li);
    }
    data.forEach((row) => {
      const li = document.createElement("li");
      const a = document.createElement("span");
      const b = document.createElement("span");
      a.textContent = row.method;
      b.textContent = new Date(row.created_at).toLocaleString();
      li.append(a, b);
      list.appendChild(li);
    });
  }

  Lib.hooks.afterLogin.push(async (user) => {
    await Lib.once("db_" + user.id, () => recordLogin(user));
    await loadLogs();
  });
})();