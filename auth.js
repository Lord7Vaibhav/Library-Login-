(() => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;
  const Lib = window.Lib;
  const sb = (Lib.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));

  /* Email + Password (signup aur login dono) */
  Lib.handlers.password = async ({ mode, email, password, name }) => {
    sessionStorage.setItem("method", "password");

    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) return Lib.toast(error.message, "error");
      if (!data.session) Lib.toast("Library card ban gaya! Email confirm karke sign in karo.", "success");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) Lib.toast(error.message, "error");
    }
  };

  /* Logout */
  Lib.handlers.logout = async () => {
    await sb.auth.signOut();
    sessionStorage.clear();
    Lib.toast("Signed out. Happy reading! 📚", "success");
  };

  /* Session change hote hi dashboard / login view badalna */
  sb.auth.onAuthStateChange((_event, session) => Lib.render(session));
})();