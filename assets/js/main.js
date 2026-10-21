/* =========================================================
   Cabinet Yann Quillevere — scripts du site
   ========================================================= */

/* ---- RÉGLAGES À COMPLÉTER ------------------------------------------
   BOOKING_PROVIDER : "cal" (Cal.com, gratuit) ou "calendly".
   CAL_LINK     : identifiant de l'événement Cal.com, ex. "yann-quillevere/consultation-initiale"
                  (paiement Stripe activé dans l'événement, agenda Google connecté).
   CALENDLY_URL : lien de l'événement si l'on utilise Calendly à la place.
   GTM_ID       : identifiant Google Tag Manager (fourni par V. Maisonneuve).
   Tant que GTM_ID vaut "GTM-XXXXXXX", aucun traceur n'est chargé.
--------------------------------------------------------------------- */
var SITE_CONFIG = {
  BOOKING_PROVIDER: "cal",
  CAL_LINK: "VOTRE-COMPTE/consultation-initiale",
  CALENDLY_URL: "https://calendly.com/VOTRE-COMPTE/consultation-initiale",
  GTM_ID: "GTM-XXXXXXX",
  // Fiche Google du cabinet (Place ID) et clé « Maps Embed API » (gratuite, à créer dans Google Cloud).
  // Sans clé, la carte est affichée à partir de l'adresse.
  MAPS_PLACE_ID: "ChIJOaXjF5weEEgRL9tEUxrMHTk",
  MAPS_EMBED_KEY: "",
  MAPS_ADDRESS: "3 rue Autissier, 56000 Vannes",
  CONSENT_KEY: "yq_consent_v1",
  CONSENT_DAYS: 180
};

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

/* Consent Mode v2 : tout est refusé par défaut */
gtag("consent", "default", {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  wait_for_update: 500
});

(function () {
  "use strict";

  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- En-tête au défilement ---------- */
  var header = $(".site-header");
  // Bouton flottant « Réserver » : visible après le haut de page, masqué sur la page de réservation
  var floatCta = $(".float-cta");
  var onBookingPage = !!$("#booking");
  var onScroll = function () {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (floatCta && !onBookingPage) floatCta.classList.toggle("is-visible", y > window.innerHeight * 0.6);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  // Masqué quand le pied de page est visible (il ne doit rien recouvrir)
  var footer = $(".site-footer");
  if (floatCta && footer && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { floatCta.classList.toggle("is-hidden", en[0].isIntersecting); }).observe(footer);
  }

  /* ---------- Sommaire « Sur cette page » (pages longues) ---------- */
  var toc = $(".toc");
  var titles = $$(".prose h2");
  if (toc && titles.length > 2) {
    var list = $("ol", toc);
    titles.forEach(function (h, i) {
      if (!h.id) h.id = "partie-" + (i + 1);
      var li = doc.createElement("li");
      li.innerHTML = '<a href="#' + h.id + '"></a>';
      li.firstChild.textContent = h.textContent.replace(/\s+/g, " ").trim();
      list.appendChild(li);
    });
    toc.hidden = false;
    var links = $$("a", toc);
    var mark = function () {
      var current = 0;
      titles.forEach(function (h, i) { if (h.getBoundingClientRect().top < 160) current = i; });
      links.forEach(function (a, i) { a.classList.toggle("is-current", i === current); });
    };
    window.addEventListener("scroll", mark, { passive: true });
    mark();
  }

  /* ---------- Menu mobile ---------- */
  var burger = $(".burger");
  var nav = $("#nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      doc.body.style.overflow = open ? "" : "hidden";
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) burger.click();
    });
  }
  $$(".has-sub > .nav-link").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var li = btn.parentElement;
      var open = li.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  doc.addEventListener("click", function (e) {
    $$(".has-sub.is-open").forEach(function (li) {
      if (!li.contains(e.target) && window.innerWidth > 1100) {
        li.classList.remove("is-open");
        $(".nav-link", li).setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------- Apparition douce ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Année ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Suivi des conversions (envoyé à GTM) ---------- */
  doc.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) window.dataLayer.push({ event: "clic_telephone", lien: href });
    else if (href.indexOf("mailto:") === 0) window.dataLayer.push({ event: "clic_email" });
    else if (a.hasAttribute("data-cta")) window.dataLayer.push({ event: "clic_cta_rdv", emplacement: a.getAttribute("data-cta") });
  });

  /* ---------- Consentement cookies (CNIL) ---------- */
  var banner = $("#cookie");
  var store = {
    get: function () {
      try {
        var raw = localStorage.getItem(SITE_CONFIG.CONSENT_KEY);
        if (!raw) return null;
        var v = JSON.parse(raw);
        if (Date.now() - v.t > SITE_CONFIG.CONSENT_DAYS * 864e5) return null;
        return v.c;
      } catch (err) { return null; }
    },
    set: function (c) {
      try { localStorage.setItem(SITE_CONFIG.CONSENT_KEY, JSON.stringify({ c: c, t: Date.now() })); } catch (err) {}
    }
  };

  var gtmLoaded = false;
  function loadGTM() {
    var id = SITE_CONFIG.GTM_ID;
    if (gtmLoaded || !id || id.indexOf("XXXX") > -1) return;
    gtmLoaded = true;
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var s = doc.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    doc.head.appendChild(s);
  }

  function applyConsent(c) {
    var v = c === "granted" ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v
    });
    if (v === "granted") loadGTM();
  }

  function showBanner() { if (banner) banner.classList.add("is-visible"); }
  function hideBanner() { if (banner) banner.classList.remove("is-visible"); }

  var saved = store.get();
  if (saved) applyConsent(saved); else showBanner();

  $$("[data-consent]").forEach(function (b) {
    b.addEventListener("click", function () {
      var c = b.getAttribute("data-consent");
      store.set(c);
      applyConsent(c);
      hideBanner();
    });
  });
  $$("[data-open-cookies]").forEach(function (b) {
    b.addEventListener("click", function () { showBanner(); });
  });

  /* ---------- Agenda de réservation (chargé au clic : aucun cookie tiers avant) ---------- */
  var bookingDone = function () { window.dataLayer.push({ event: "rdv_reserve_paye" }); };

  function loadCal(box) {
    box.innerHTML = '<div id="cal-inline" style="width:100%;height:100%;min-height:640px;overflow:auto"></div>';
    /* Code d'intégration officiel Cal.com */
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    Cal("init", { origin: "https://cal.com" });
    Cal("inline", { elementOrSelector: "#cal-inline", calLink: SITE_CONFIG.CAL_LINK, layout: "month_view", config: { theme: "light" } });
    Cal("ui", { theme: "light", styles: { branding: { brandColor: "#B8553A" } }, hideEventTypeDetails: false, layout: "month_view" });
    Cal("on", { action: "bookingSuccessfulV2", callback: bookingDone });
    Cal("on", { action: "bookingSuccessful", callback: bookingDone });
  }

  function loadCalendly(box) {
    var url = SITE_CONFIG.CALENDLY_URL + (SITE_CONFIG.CALENDLY_URL.indexOf("?") > -1 ? "&" : "?") +
      "hide_gdpr_banner=1&locale=fr&primary_color=b8553a";
    box.innerHTML = '<div class="calendly-inline-widget" data-url="' + url + '"></div>';
    var s = doc.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    doc.body.appendChild(s);
    window.addEventListener("message", function (e) {
      if (e.origin === "https://calendly.com" && e.data && e.data.event === "calendly.event_scheduled") bookingDone();
    });
  }

  $$("[data-load-booking]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = doc.getElementById(btn.getAttribute("data-load-booking"));
      if (!box) return;
      box.classList.add("is-loaded");
      if (SITE_CONFIG.BOOKING_PROVIDER === "calendly") loadCalendly(box); else loadCal(box);
      window.dataLayer.push({ event: "ouverture_agenda" });
    });
  });
  // Lien direct « #reserver » : on ouvre l'agenda automatiquement
  if (location.hash === "#reserver") {
    var autoBtn = $("[data-load-booking]");
    if (autoBtn) autoBtn.click();
  }

  /* ---------- Carte Google (chargée au clic) ---------- */
  $$("[data-load-map]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".map");
      var src = SITE_CONFIG.MAPS_EMBED_KEY
        ? "https://www.google.com/maps/embed/v1/place?key=" + encodeURIComponent(SITE_CONFIG.MAPS_EMBED_KEY) +
          "&q=place_id:" + encodeURIComponent(SITE_CONFIG.MAPS_PLACE_ID) + "&language=fr"
        : "https://www.google.com/maps?q=" + encodeURIComponent(SITE_CONFIG.MAPS_ADDRESS) + "&output=embed&hl=fr";
      box.innerHTML = '<iframe title="Plan d\'accès au cabinet" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + src + '"></iframe>';
      window.dataLayer.push({ event: "ouverture_carte" });
    });
  });

  /* ---------- Formulaire de contact ---------- */
  var form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", function () {
      window.dataLayer.push({ event: "formulaire_contact_envoye" });
    });
  }
})();
