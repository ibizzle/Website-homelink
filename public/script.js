const form = document.getElementById("enquiry-form");
const status = document.getElementById("form-status");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Sending";

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      status.textContent = "Enquiry received. We will reply within one business day.";
    } catch (error) {
      status.textContent = "Unable to submit. Please email hello@homelink.example.";
    }
  });
}
