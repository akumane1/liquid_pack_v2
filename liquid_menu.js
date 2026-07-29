(function () {
  const PaneClass = window.Pane || (window.Tweakpane && window.Tweakpane.Pane);
  const gsapObj = window.gsap;
  const DraggableObj = window.Draggable || window.gsap?.Draggable;

  if (gsapObj && DraggableObj && gsapObj.registerPlugin) {
    gsapObj.registerPlugin(DraggableObj);
  }

  const config = {
    frost: 0.00,
    saturation: 2.0,
    width: 820,
    height: 72,
    radius: 36,
    border: 0.10,
    alpha: 0.93,
    lightness: 50,
    blur: 11,
    displace: 0.7,
    x: 'R',
    y: 'B',
    blend: 'difference',
    scale: 22,
    r: 0,
    g: 10,
    b: 20,
    debug: false
  };

  const debugPen = document.querySelector('.displacement-debug');
  const liquidHeader = document.querySelector('.liquid-header');

  function buildDisplacementImage() {
    const border = Math.min(config.width, config.height) * (config.border * 0.5);
    const kids = `
      <svg class="displacement-image" viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${config.width}" height="${config.height}" fill="black"></rect>
        <rect x="0" y="0" width="${config.width}" height="${config.height}" rx="${config.radius}" fill="url(#red)" />
        <rect x="0" y="0" width="${config.width}" height="${config.height}" rx="${config.radius}" fill="url(#blue)" style="mix-blend-mode: ${config.blend}" />
        <rect x="${border}" y="${border}" width="${config.width - border * 2}" height="${config.height - border * 2}" rx="${config.radius}" fill="hsl(0 0% ${config.lightness}% / ${config.alpha})" style="filter:blur(${config.blur}px)" />
      </svg>
    `;

    if (debugPen) {
      debugPen.innerHTML = kids;
      const svgEl = debugPen.querySelector('.displacement-image');
      if (svgEl) {
        const serialized = new XMLSerializer().serializeToString(svgEl);
        const encoded = encodeURIComponent(serialized);
        const dataUri = `data:image/svg+xml,${encoded}`;

        const feImage = document.querySelector('feImage');
        if (feImage) {
          feImage.setAttribute('href', dataUri);
          feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUri);
        }
      }
    }
  }

  function update() {
    if (liquidHeader && liquidHeader.offsetWidth) {
      config.width = liquidHeader.offsetWidth;
    }
    buildDisplacementImage();
    const root = document.documentElement;
    root.style.setProperty('--width', config.width);
    root.style.setProperty('--height', config.height);
    root.style.setProperty('--radius', config.radius);
    root.style.setProperty('--frost', config.frost);
    root.style.setProperty('--saturation', config.saturation);

    const feDisplacements = document.querySelectorAll('feDisplacementMap');
    feDisplacements.forEach(fe => {
      fe.setAttribute('scale', config.scale);
      fe.setAttribute('xChannelSelector', config.x);
      fe.setAttribute('yChannelSelector', config.y);
    });

    const redCh = document.querySelector('#redchannel');
    if (redCh) redCh.setAttribute('scale', config.scale + config.r);

    const greenCh = document.querySelector('#greenchannel');
    if (greenCh) greenCh.setAttribute('scale', config.scale + config.g);

    const blueCh = document.querySelector('#bluechannel');
    if (blueCh) blueCh.setAttribute('scale', config.scale + config.b);

    const feBlur = document.querySelector('feGaussianBlur');
    if (feBlur) feBlur.setAttribute('stdDeviation', config.displace);

    root.dataset.debug = config.debug;
  }

  window.addEventListener('resize', update);

  // Interactive Menu Link Switching
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Tweakpane
  if (PaneClass) {
    const ctrl = new PaneClass({
      title: 'Liquid Menu Config',
      expanded: true
    });

    ctrl.addBinding(config, 'debug', { label: 'show map' });
    ctrl.addBinding(config, 'frost', { min: 0, max: 1, step: 0.01 });
    ctrl.addBinding(config, 'saturation', { min: 0, max: 3, step: 0.1 });
    ctrl.addBinding(config, 'scale', { min: -500, max: 500, step: 1 });
    ctrl.addBinding(config, 'radius', { min: 0, max: 100, step: 1 });

    const abb = ctrl.addFolder({ title: 'chromatic' });
    abb.addBinding(config, 'r', { min: -50, max: 50, step: 1, label: 'red' });
    abb.addBinding(config, 'g', { min: -50, max: 50, step: 1, label: 'green' });
    abb.addBinding(config, 'b', { min: -50, max: 50, step: 1, label: 'blue' });

    ctrl.on('change', update);
  }

  // Draggable
  if (DraggableObj) {
    DraggableObj.create('.liquid-header', {
      type: 'x,y',
      edgeResistance: 0.65,
      bounds: window
    });
  }

  update();
})();
