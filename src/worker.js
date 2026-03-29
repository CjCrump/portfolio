import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async fetch(request, env) {

    // Serve static assets for everything except the form endpoint
    if (request.method !== "POST" || !new URL(request.url).pathname.startsWith("/contact")) {
      return env.ASSETS.fetch(request);
    }

    const data = await request.formData();
    const name    = data.get("name")    || "";
    const email   = data.get("email")   || "";
    const message = data.get("message") || "";
    const botField = data.get("bot-field") || "";

    // Honeypot check
    if (botField) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Basic validation
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Build the email
    const msg = createMimeMessage();
    msg.setSender({ name: "ChanceIT Studio Contact", addr: "contact@chanceitstudio.com" });
    msg.setRecipient("chance@chanceitstudio.com");
    msg.setSubject(`New contact from ${name}`);
    msg.addMessage({
      contentType: "text/plain",
      data: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    });

    const emailMsg = new EmailMessage(
      "contact@chanceitstudio.com",
      "chance@chanceitstudio.com",
      msg.asRaw()
    );

    await env.CONTACT_MAILER.send(emailMsg);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};