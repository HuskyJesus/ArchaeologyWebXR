/* UCF WebXR landing page enhancement.
   Navigation itself is plain <a> links, so everything works without this
   script. The only enhancement: clicking anywhere on a project card follows
   that card's link, while preserving text selection and modified clicks. */

(function () {
  'use strict';

  var cards = document.querySelectorAll('.project-card');

  Array.prototype.forEach.call(cards, function (card) {
    var link = card.querySelector('.card-button');
    if (!link) return;

    card.style.cursor = 'pointer';

    card.addEventListener('click', function (event) {
      // Let real links, buttons, and modified clicks behave natively.
      if (event.target.closest('a, button')) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      // Do not steal a click that ends a text selection.
      var selection = window.getSelection();
      if (selection && selection.type === 'Range') return;

      link.click();
    });
  });
})();
