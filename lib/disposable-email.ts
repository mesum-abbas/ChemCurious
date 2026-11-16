/**
 * Blocks sign-ups from well-known throwaway inbox providers (bot account creation).
 * Static list, no network calls or new dependencies. It covers the big public services,
 * not every disposable domain in existence; extend DISPOSABLE_DOMAINS as new ones show up.
 * Subdomains match too (e.g. "x.mailinator.com").
 */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "10minutemail.net", "20minutemail.com", "33mail.com", "anonbox.net",
  "burnermail.io", "byom.de", "chacuo.net", "discard.email", "discardmail.com", "dispostable.com",
  "dropmail.me", "emailondeck.com", "emailfake.com", "fakeinbox.com", "fakemail.net",
  "getairmail.com", "getnada.com", "guerrillamail.biz", "guerrillamail.com", "guerrillamail.de",
  "guerrillamail.info", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
  "harakirimail.com", "inboxbear.com", "inboxkitten.com", "incognitomail.org", "jetable.org",
  "kasmail.com", "linshiyouxiang.net", "mail.tm", "mail-temp.com", "mailcatch.com",
  "maildrop.cc", "mailinator.com", "mailinator.net", "mailinator2.com", "mailnesia.com",
  "mailpoof.com", "mailsac.com", "mintemail.com", "moakt.com", "mohmal.com", "mytemp.email",
  "mytrashmail.com", "nada.email", "nowmymail.com", "oneoffemail.com", "sharklasers.com",
  "spam4.me", "spambog.com", "spamgourmet.com", "spamex.com", "tempail.com", "tempinbox.com",
  "temp-mail.io", "temp-mail.org", "tempmail.com", "tempmail.dev", "tempmail.net",
  "tempmailo.com", "tempmail.plus", "tempr.email", "throwawaymail.com", "tmail.ws",
  "tmpmail.net", "tmpmail.org", "trash-mail.com", "trashmail.com", "trashmail.de",
  "trashmail.net", "trbvm.com", "wegwerfmail.de", "yopmail.com", "yopmail.fr", "yopmail.net",
  "grr.la", "pokemail.net", "spamthisplease.com", "emailtemporanea.net", "fexpost.com",
  "fexbox.org", "mailbox.in.ua", "minuteinbox.com", "cuvox.de", "dayrep.com", "einrot.com",
  "fleckens.hu", "gustr.com", "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us",
  "armyspy.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split("@")[1];
  if (!domain) return false;
  // Check the domain and each parent: a.b.mailinator.com -> b.mailinator.com -> mailinator.com
  const labels = domain.split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(labels.slice(i).join("."))) return true;
  }
  return false;
}
