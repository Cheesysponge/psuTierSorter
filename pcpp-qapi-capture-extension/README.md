# PCPartPicker QAPI Capture Extension

This unpacked extension passively captures PCPartPicker product-list QAPI responses that your browser already loads.

It does not paginate, click, refresh, replay QAPI calls, or make extra PCPartPicker requests.

## Install

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Click "Load unpacked".
4. Select this folder: `pcpp-qapi-capture-extension`.

## Use

1. Open the PCPartPicker power-supply page in your browser.
2. Apply the filters/sort you want.
3. Manually open each page you want captured.
4. Click the extension icon.
5. Use "Export JSON" for raw combined QAPI data, or "Export CSV" for `psus_located.csv` format.

The extension stores one capture per page number. Visiting a page again replaces that page's stored capture.
