(function () {
  var walker,
    node,
    _preventer = function (evt) { evt.preventDefault(); },
    sheet = document.createElement('style'),
    observer = new MutationObserver(function (records, self) {
      var target, inert, record, reinitSet = new Set();

      for (record of records) {
        target = record.target;

        if (record.type == 'attributes' && record.attributeName === 'inert-container') {
          // if someone added an inert-container or removed an inert container...
          if (target.hasAttribute('inert-container')) {
            document.inertify(target);
          } else {
            document.deinertify(target);
          }
        } else  {
          // if someone added other element..
          Array.from(record.addedNodes).forEach((child) => {
            var inheritedAncestor;
            if (child.hasAttribute && child.hasAttribute('inert-container')) {
              document.inertify(child);
            } else {
              // collect a set of
              inertedAncestor = child.closest && child.closest('[inert-container]');
              if (inertedAncestor) {
                reinitSet.add(inertedAncestor);
              }
            }
          });

          reinitSet.forEach((item) => {
            document.inertify(item, true);
          });
        }
      }
    });

  Object.defineProperty(HTMLElement.prototype, 'isInert', {
    get: function () {
      return this.closest('[inert-container]') !== null;
    },
    set: function (val) {
      if (val === true) {
        document.inertify(this);
      } else if (val === false) {
        document.deinertify(this);
      } else {
        throw new Error('isInert requires a boolean argument to set');
      }
    }
  });

  document.inertify = function (element, _internal) {
    var node, walker;

    if (!element) {
      throw new Error('Missing required argument. inertify() needs an element reference');
    }

    if (_internal !== true) {
      element.addEventListener('click', _preventer, true);
      if (element.hasAttribute('aria-hidden')) {
        // if this was aria-hidden already, save it
        element.setAttribute('inertariahidden', 'true');
      }
      if (!element.hasAttribute('inert-container')) {
        element.setAttribute('inert-container', '');
      }
      if (!element.hasAttribute('aria-hidden')) {
        element.setAttribute('aria-hidden', 'true');
      }
    }

    walker=document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, null, false);

    while(node = walker.nextNode()) {
       // If the child has an explict tabindex save it
      if (node.hasAttribute('tabindex')) {
        node.setAttribute('inerttabindex', node.tabIndex);
        node.removeAttribute('tabindex');
      }

    }
  };

  document.deinertify = function (element, _interal) {
    var node, walker;

    if (!element) {
      throw new Error('Missing required argument. deinertify() needs an element reference');
    }

    element.removeEventListener('click', _preventer, true);
    if (!element.hasAttribute('inertariahidden')) {
      element.removeAttribute('aria-hidden');
    }
    element.removeAttribute('inert-container');
    element.removeAttribute('inertariahidden');

    walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, function (node) {
      return (!node.hasAttribute('inert-container')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }, false);

    while(node = walker.nextNode()) {
       if (node.hasAttribute('inerttabindex')) {
          node.setAttribute('tabindex', node.getAttribute('inerttabindex'));
          node.removeAttribute('inerttabindex');
       }
    }
  };

  sheet.innerHTML = '@charset \"utf-8\"; [inert-container] {opacity: 0.5;}'
  document.head.appendChild(sheet);

  observer.observe(document.body, { attributes: true, subtree: true, childList: true });

  walker=document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
  while(node = walker.nextNode()) {
     // If the child has an explict tabindex save it
    if (node.hasAttribute('inert-container')) {
      document.inertify(node);
    }
  }

}());
