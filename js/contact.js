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

  const errorBox = document.getElementById("contact-error");
  const sendButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    success.classList.add("hidden");
    errorBox.classList.add("hidden");
    const results = Object.keys(fields).map(validate);
    if (results.includes(false)) {
      form.querySelector(".field.error input, .field.error select, .field.error textarea").focus();
      return;
    }
    const subject = fields.subject.value;
    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim() || "Not provided",
      subject,
      message: fields.message.value.trim(),
      _subject: `Heritage Trail contact: ${subject}`,
      _replyto: fields.email.value.trim(),
      _template: "table",
      _captcha: "false"
    };
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || String(data.success) !== "true") {
        throw new Error(data.message || "Send failed");
      }
      form.reset();
      counter.textContent = "20–500 characters";
      success.classList.remove("hidden");
      showToast("Message sent. Thank you!", "✉️");
    } catch (error) {
      const needsActivation = /activat/i.test(error.message);
      errorBox.innerHTML = needsActivation
        ? `This contact form is being set up. An activation email has been sent to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. Once it's confirmed, messages will be delivered.`
        : `Sorry, your message couldn't be sent. Please try again, or email us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
      errorBox.classList.remove("hidden");
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send message";
    }
  });

  form.addEventListener("reset", () => {
    Object.values(fields).forEach((input) => setFieldError(input, ""));
  });
});
