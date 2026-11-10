document.addEventListener("DOMContentLoaded", () => {
  const accountPanel = document.getElementById("account-panel");
  const userAuth = document.getElementById("user-auth");
  const adminForm = document.getElementById("admin-login-form");
  const loginForm = document.getElementById("user-login-form");
  const signupForm = document.getElementById("signup-form");
  const tabs = { login: document.getElementById("tab-login"), signup: document.getElementById("tab-signup") };
  const forms = { login: loginForm, signup: signupForm };
  const showAdminButton = document.getElementById("show-admin");
  const adminText = document.querySelector("[data-admin-text]");
  const f = (id) => document.getElementById(id);

  /* Views */

  const showTab = (name) => {
    Object.keys(tabs).forEach((key) => {
      tabs[key].classList.toggle("active", key === name);
      tabs[key].setAttribute("aria-selected", key === name ? "true" : "false");
      forms[key].classList.toggle("hidden", key !== name);
    });
    history.replaceState(null, "", name === "signup" ? "login.html?signup" : "login.html");
  };

  const showView = (view) => {
    const user = getCurrentUser();
    accountPanel.classList.toggle("hidden", view !== "account");
    userAuth.classList.toggle("hidden", view !== "user");
    adminForm.classList.toggle("hidden", view !== "admin");
    showAdminButton.textContent = isAdmin() ? "Go to dashboard" : view === "admin" ? "Back to explorer login" : "Admin login";
    adminText.textContent = isAdmin() ? "You're signed in as admin." : "Manage landmarks and their verification quizzes.";
    if (view === "account" && user) {
      const progress = getProgress();
      accountPanel.querySelector("[data-account-name]").textContent = progress.name || user.name;
      accountPanel.querySelector("[data-account-email]").textContent = user.email;
      accountPanel.querySelector("[data-account-xp]").textContent = progress.xp;
      accountPanel.querySelector("[data-account-stamps]").textContent = progress.visited.length;
      accountPanel.querySelector("[data-account-badges]").textContent = progress.badges.length;
    }
    if (view === "admin") {
      f("admin-user").focus();
    }
  };

  const defaultView = () => (getCurrentUser() ? "account" : "user");

  Object.keys(tabs).forEach((key) => tabs[key].addEventListener("click", () => showTab(key)));
  document.querySelectorAll("[data-show-tab]").forEach((button) => button.addEventListener("click", () => showTab(button.dataset.showTab)));

  showAdminButton.addEventListener("click", () => {
    if (isAdmin()) {
      location.href = "admin.html";
    } else if (!adminForm.classList.contains("hidden")) {
      showView(defaultView());
    } else {
      showView("admin");
    }
  });

  f("admin-back").addEventListener("click", () => showView(defaultView()));

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = f(button.dataset.togglePassword);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  /* Explorer login */

  const loginError = f("user-login-error");
  const loginEmail = f("login-email");
  const loginPassword = f("login-password");

  [loginEmail, loginPassword].forEach((input) => input.addEventListener("input", () => {
    setFieldError(input, "");
    loginError.classList.add("hidden");
  }));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const okEmail = setFieldError(loginEmail, loginEmail.value.trim() ? "" : "Enter your email.");
    const okPassword = setFieldError(loginPassword, loginPassword.value ? "" : "Enter your password.");
    if (!okEmail || !okPassword) return;
    const user = await loginUser(loginEmail.value.trim(), loginPassword.value);
    if (!user) {
      loginError.classList.remove("hidden");
      loginPassword.value = "";
      loginPassword.focus();
      return;
    }
    loginForm.reset();
    showView("account");
    showToast(`Welcome back, ${user.name.split(" ")[0]}!`, "👋");
  });

  /* Sign up */

  const signup = {
    name: f("signup-name"),
    email: f("signup-email"),
    password: f("signup-password"),
    confirm: f("signup-confirm")
  };
  const terms = f("signup-terms");
  const termsError = f("terms-error");

  const rules = {
    name: (v) => (!v ? "Enter your name." : !/^[A-Za-z ]{3,30}$/.test(v) ? "Use 3–30 letters and spaces." : ""),
    email: (v) => {
      if (!v) return "Enter your email.";
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return "Enter a valid email address, e.g. name@example.com.";
      if (getUsers().some((u) => u.email === v.toLowerCase())) return "An account with this email already exists. Log in instead.";
      return "";
    },
    password: (v) => {
      if (!v) return "Create a password.";
      if (v.length < 8) return "Use at least 8 characters.";
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Include at least one letter and one number.";
      return "";
    },
    confirm: (v) => (!v ? "Re-enter your password." : v !== signup.password.value ? "Passwords don't match." : "")
  };

  const validate = (key) => setFieldError(signup[key], rules[key](key === "name" || key === "email" ? signup[key].value.trim() : signup[key].value));

  Object.keys(signup).forEach((key) => {
    signup[key].addEventListener("blur", () => {
      if (signup[key].value) validate(key);
    });
    signup[key].addEventListener("input", () => {
      if (signup[key].closest(".field").classList.contains("error")) validate(key);
      if (key === "password" && signup.confirm.value) validate("confirm");
    });
  });

  terms.addEventListener("change", () => (termsError.style.display = ""));

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const results = Object.keys(signup).map(validate);
    termsError.style.display = terms.checked ? "" : "block";
    if (results.includes(false) || !terms.checked) {
      const first = signupForm.querySelector(".field.error input");
      if (first) first.focus();
      return;
    }
    const name = signup.name.value.trim().replace(/\s+/g, " ");
    await registerUser(name, signup.email.value.trim(), signup.password.value);
    signupForm.reset();
    showView("account");
    showToast(`Account created. Welcome, ${name.split(" ")[0]}!`, "🎉");
  });

  f("user-logout").addEventListener("click", () => {
    logoutUser();
    showTab("login");
    showView("user");
    showToast("You've logged out. Progress is now saved as a guest.", "👋");
  });

  /* Admin login */

  const adminUser = f("admin-user");
  const adminPass = f("admin-pass");
  const adminError = f("admin-login-error");

  [adminUser, adminPass].forEach((input) => input.addEventListener("input", () => {
    setFieldError(input, "");
    adminError.classList.add("hidden");
  }));

  adminForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const okUser = setFieldError(adminUser, adminUser.value.trim() ? "" : "Enter your username.");
    const okPass = setFieldError(adminPass, adminPass.value ? "" : "Enter your password.");
    if (!okUser || !okPass) return;
    if (adminUser.value.trim() === ADMIN_USERNAME && adminPass.value === ADMIN_PASSWORD) {
      session.set(STORAGE_KEYS.admin, "true");
      location.href = "admin.html";
    } else {
      adminError.classList.remove("hidden");
      adminPass.value = "";
      adminPass.focus();
    }
  });

  /* Start */

  const params = new URLSearchParams(location.search);
  if (params.has("signup")) showTab("signup");
  if (params.has("admin")) {
    if (isAdmin()) {
      location.replace("admin.html");
      return;
    }
    showView("admin");
  } else {
    showView(defaultView());
  }
});
