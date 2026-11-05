/* start the deck */
(function () {
  'use strict';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.App || !App.slides.length) {
      console.error('No slides registered.');
      return;
    }
    App.start();
  });
})();
