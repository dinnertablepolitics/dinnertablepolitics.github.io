/* Site configuration. No secrets belong in this file: everything here is public.
 *
 * Analytics is OFF by default. To switch it on with GoatCounter (free for non-commercial
 * sites, sets no cookies, stores no personal data):
 *   1. create a site at https://www.goatcounter.com and note its code, e.g. "dinnertable";
 *   2. set provider: "goatcounter" and code: "dinnertable" below;
 *   3. in every .html file, add https://gc.zgo.at to script-src and
 *      https://dinnertable.goatcounter.com to connect-src in the Content-Security-Policy line.
 * The consent banner then appears on the first visit and analytics loads only after "Allow".
 */
window.SITE_CONFIG = {
  analytics: {
    provider: null,      // null | "goatcounter"
    code: ""
  }
};
