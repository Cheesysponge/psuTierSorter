(function () {
  "use strict";

  const QAPI_PATH = "/qapi/product/category/";
  const EVENT_NAME = "__PCPP_QAPI_CAPTURE__";

  function isQapiUrl(url) {
    try {
      return String(url || "").includes(QAPI_PATH);
    } catch (_) {
      return false;
    }
  }

  function bodyToText(body) {
    if (!body) return "";
    if (typeof body === "string") return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof FormData) return new URLSearchParams(body).toString();
    return "";
  }

  function postCapture(url, method, requestBody, responseText) {
    if (!responseText) return;
    window.postMessage(
      {
        source: EVENT_NAME,
        capturedAt: new Date().toISOString(),
        url: String(url || ""),
        method: String(method || "GET").toUpperCase(),
        requestBody: bodyToText(requestBody),
        responseText: String(responseText)
      },
      window.location.origin
    );
  }

  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function patchedFetch(input, init) {
      const request = input instanceof Request ? input : null;
      const url = request ? request.url : String(input || "");
      const method = (init && init.method) || (request && request.method) || "GET";
      const requestBody = init && init.body;
      const response = await originalFetch.apply(this, arguments);

      if (isQapiUrl(url)) {
        response
          .clone()
          .text()
          .then((text) => postCapture(url, method, requestBody, text))
          .catch(() => {});
      }

      return response;
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    this.__pcppCapture = {
      method: method || "GET",
      url: url || ""
    };
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    const meta = this.__pcppCapture;
    if (meta && isQapiUrl(meta.url)) {
      this.addEventListener("loadend", () => {
        try {
          postCapture(meta.url, meta.method, body, this.responseText);
        } catch (_) {}
      });
    }

    return originalSend.apply(this, arguments);
  };
})();
