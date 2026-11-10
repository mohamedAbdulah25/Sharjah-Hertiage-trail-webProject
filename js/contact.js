document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const success = document.getElementById("contact-success");
  const fields = {
    name: document.getElementById("c-name"),
    email: document.getElementById("c-email"),
    phone: document.getElementById("c-phone"),
    subject: document.getElementById("c-subject"),
    message: document.getElementById("c-message")
  };
  const counter = form.querySelector("#c-message ~ .hint");

  const rules = {
    name: (v) => (!v ? "Enter your name." : !/^[A-Za-z ]{3,}$/.test(v) ? "Use at least 3 letters (letters and spaces only)." : ""),
    email: (v) => (!v ? "Enter your email." : !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v) ? "Enter a valid email address, e.g. name@example.com." : ""),
    phone: (v) => (v && !/^05\d{8}$/.test(v) ? "Use the UAE format 05XXXXXXXX." : ""),
    subject: (v) => (!v ? "Choose a subject." : ""),
    message: (v) => (v.length < 20 ? `Write at least 20 characters (${20 - v.length} more).` : v.length > 500 ? "Keep it under 500 characters." : "")
  };

  const validate = (key) => setFieldError(fields[key], rules[key](fields[key].value.trim()));

  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener("blur", () => validate(key));
    fields[key].addEventListener("input", () => {
      success.classList.add("hidden");
      if (fields[key].closest(".field").classList.contains("error")) {
        validate(key);
      }
    });
  });

  fields.message.addEventListener("input", () => {
    counter.textContent = `${fields.message.value.length}/500 characters`;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    success.classList.add("hidden");
    const results = Object.keys(fields).map(validate);
    if (results.includes(false)) {
      form.querySelector(".field.error input, .field.error select, .field.error textarea").focus();
      return;
    }
    const subject = `Heritage Trail: ${fields.subject.value}`;
    const body = [
      fields.message.value.trim(),
      "",
      "---",
      `Name: ${fields.name.value.trim()}`,
      `Email: ${fields.email.value.trim()}`,
      `Phone: ${fields.phone.value.trim() || "Not provided"}`
    ].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    success.classList.remove("hidden");
  });

  form.addEventListener("reset", () => {
    Object.values(fields).forEach((input) => setFieldError(input, ""));
  });
});
