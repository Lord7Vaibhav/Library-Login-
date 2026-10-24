(() => {
  const Lib = window.Lib;
  const url = window.APP_CONFIG.SHEETS_WEBHOOK_URL;

  Lib.hooks.afterLogin.push((user) =>
    Lib.once("sheet_" + user.id, async () => {
      if (!url || url.includes("YOUR_ID")) return;   // URL set nahi hai to skip

      const meta = user.user_metadata || {};
      const payload = {
        name: meta.full_name || meta.name || user.email.split("@")[0],
        email: user.email,
        cardNo: Lib.cardNo(user),
        method: sessionStorage.getItem("method") || user.app_metadata?.provider || "unknown"
      };

      // no-cors: response padh nahi sakte, par row Sheet mein add ho jaati hai
      fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).catch((err) => console.error("Sheets error:", err));
    })
  );
})();