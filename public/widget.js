/**
 * Gift Ghor AI Customer Support Widget Loader
 * Embed script for Google Tag Manager (GTM) or direct <body> injection.
 * Strict isolation: Does not expose admin credentials or private endpoints.
 */
(function(window, document) {
  'use strict';

  if (window.GiftGhorAIWidgetLoaded) return;
  window.GiftGhorAIWidgetLoaded = true;

  var SCRIPT_SRC = document.currentScript ? document.currentScript.src : '';
  var BASE_URL = SCRIPT_SRC ? SCRIPT_SRC.substring(0, SCRIPT_SRC.lastIndexOf('/')) : window.location.origin;

  function injectWidget(config) {
    config = config || {};
    var container = document.createElement('div');
    container.id = 'giftghor-ai-widget-container';
    container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:9999999;pointer-events:none;width:100%;height:100%;max-width:440px;max-height:680px;';

    var iframe = document.createElement('iframe');
    iframe.src = (config.endpoint || BASE_URL) + '/?mode=widget';
    // Initially small enough to just fit the button, but we start slightly larger to let React mount safely.
    // However, postMessage will resize it.
    iframe.style.cssText = 'width:100%;height:100%;border:none;background:transparent;pointer-events:auto;';
    iframe.allow = 'microphone';
    iframe.title = 'Gift Ghor Customer Support';

    container.appendChild(iframe);
    document.body.appendChild(container);

    // Initial state (Closed)
    container.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999999;width:100px;height:100px;transition:all 0.3s ease;';

    // Listen for resize messages from the widget
    window.addEventListener('message', function(e) {
      if (e.data === 'giftghor-open') {
        container.style.width = '400px';
        container.style.height = '680px';
        container.style.bottom = '20px';
        container.style.right = '20px';
      } else if (e.data === 'giftghor-close') {
        container.style.width = '100px';
        container.style.height = '100px';
        container.style.bottom = '10px';
        container.style.right = '10px';
      }
    });
  }

  window.GiftGhorAI = {
    init: injectWidget
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectWidget();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      injectWidget();
    });
  }
})(window, document);
