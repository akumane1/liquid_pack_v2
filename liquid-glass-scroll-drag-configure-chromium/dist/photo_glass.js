(function () {
  const PaneClass = window.Pane || (window.Tweakpane && window.Tweakpane.Pane);
  const gsapObj = window.gsap;
  const DraggableObj = window.Draggable || window.gsap?.Draggable;

  if (gsapObj && DraggableObj && gsapObj.registerPlugin) {
    gsapObj.registerPlugin(DraggableObj);
  }

  const base = {
    icons: false,
    scale: -180,
    radius: 16,
    border: 0.07,
    lightness: 50,
    displace: 0,
    blend: 'difference',
    x: 'R',
    y: 'B',
    alpha: 0.93,
    blur: 11,
    r: 0,
    g: 10,
    b: 20,
    saturation: 1
  };

  const presets = {
    dock: {
      ...base,
      width: 336,
      height: 96,
      displace: 0.2,
      icons: true,
      frost: 0.05
    },
    pill: {
      ...base,
      width: 200,
      height: 80,
      displace: 0,
      frost: 0,
      radius: 40
    },
    bubble: {
      ...base,
      radius: 70,
      width: 140,
      height: 140,
      displace: 0,
      frost: 0
    },
    free: {
      ...base,
      width: 140,
      height: 280,
      radius: 80,
      border: 0.15,
      alpha: 0.74,
      lightness: 60,
      blur: 10,
      displace: 0,
      scale: -300
    }
  };

  const config = {
    ...presets.dock,
    theme: 'system',
    debug: false,
    top: false,
    preset: 'dock'
  };

  let ctrl;
  if (PaneClass) {
    ctrl = new PaneClass({
      title: 'config',
      expanded: true
    });
  }

  const debugPen = document.querySelector('.displacement-debug');

  const buildDisplacementImage = () => {
    const border = Math.min(config.width, config.height) * (config.border * 0.5);
    const kids = `
      <svg class="displacement-image" viewBox="0 0 ${config.width} ${
      config.height
    }" xmlns="http://www.w3.org/2000/svg">
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
        <!-- backdrop -->
        <rect x="0" y="0" width="${config.width}" height="${
      config.height
    }" fill="black"></rect>
        <!-- red linear -->
        <rect x="0" y="0" width="${config.width}" height="${config.height}" rx="${
      config.radius
    }" fill="url(#red)" />
        <!-- blue linear -->
        <rect x="0" y="0" width="${config.width}" height="${config.height}" rx="${
      config.radius
    }" fill="url(#blue)" style="mix-blend-mode: ${config.blend}" />
        <!-- block out distortion -->
        <rect x="${border}" y="${
      Math.min(config.width, config.height) * (config.border * 0.5)
    }" width="${config.width - border * 2}" height="${
      config.height - border * 2
    }" rx="${config.radius}" fill="hsl(0 0% ${config.lightness}% / ${
      config.alpha
    }" style="filter:blur(${config.blur}px)" />
      </svg>
    `;

    if (debugPen) {
      debugPen.innerHTML = kids;

      const svgEl = debugPen.querySelector('.displacement-image');
      if (svgEl) {
        const serialized = new XMLSerializer().serializeToString(svgEl);
        const encoded = encodeURIComponent(serialized);
        const dataUri = `data:image/svg+xml,${encoded}`;

        if (gsapObj) {
          gsapObj.set('feImage', { attr: { href: dataUri } });
          gsapObj.set('feDisplacementMap', {
            attr: {
              xChannelSelector: config.x,
              yChannelSelector: config.y
            }
          });
        }
      }
    }
  };

  const update = () => {
    buildDisplacementImage();

    if (gsapObj) {
      gsapObj.set(document.documentElement, {
        '--width': config.width,
        '--height': config.height,
        '--radius': config.radius,
        '--frost': config.frost,
        '--output-blur': config.displace,
        '--saturation': config.saturation
      });

      gsapObj.set('feDisplacementMap', { attr: { scale: config.scale } });
      gsapObj.set('#redchannel', { attr: { scale: config.scale + config.r } });
      gsapObj.set('#greenchannel', { attr: { scale: config.scale + config.g } });
      gsapObj.set('#bluechannel', { attr: { scale: config.scale + config.b } });
      gsapObj.set('feGaussianBlur', { attr: { stdDeviation: config.displace } });
    }

    document.documentElement.dataset.icons = config.icons;
    document.documentElement.dataset.mode = config.preset;
    document.documentElement.dataset.top = config.top;
    document.documentElement.dataset.debug = config.debug;
    document.documentElement.dataset.theme = config.theme;
  };

  const sync = event => {
    if (
      !document.startViewTransition ||
      (event && event.target && event.target.controller &&
       event.target.controller.view.labelElement.innerText !== 'theme' &&
       event.target.controller.view.labelElement.innerText !== 'top')
    ) {
      return update();
    }
    document.startViewTransition(() => update());
  };

  if (ctrl) {
    ctrl.addBinding(config, 'debug');
    ctrl.addBinding(config, 'top');
    ctrl.addBinding(config, 'preset', {
      label: 'mode',
      options: {
        dock: 'dock',
        pill: 'pill',
        bubble: 'bubble',
        free: 'free'
      }
    }).on('change', () => {
      document.documentElement.dataset.mode = config.preset;
      settings.expanded = config.preset === 'free';
      settings.disabled = config.preset !== 'free';

      if (config.preset !== 'free') {
        const values = presets[config.preset];
        document.documentElement.dataset.icons = values.icons;
        if (gsapObj) {
          const morph = gsapObj.timeline({
            onUpdate: () => {
              ctrl.refresh();
            }
          });
          for (const [key, value] of Object.entries(values)) {
            morph.to(config, { [key]: value }, 0);
          }
        }
      }
    });

    ctrl.addBinding(config, 'theme', {
      label: 'theme',
      options: {
        system: 'system',
        light: 'light',
        dark: 'dark'
      }
    });

    const settings = ctrl.addFolder({
      title: 'settings',
      disabled: true,
      expanded: false
    });

    settings.addBinding(config, 'frost', { min: 0, max: 1, step: 0.01 });
    settings.addBinding(config, 'saturation', { min: 0, max: 2, step: 0.1 });
    settings.addBinding(config, 'icons');
    settings.addBinding(config, 'width', { min: 80, max: 600, step: 1, label: 'width (px)' });
    settings.addBinding(config, 'height', { min: 35, max: 600, step: 1, label: 'height (px)' });
    settings.addBinding(config, 'radius', { min: 0, max: 500, step: 1, label: 'radius (px)' });
    settings.addBinding(config, 'border', { min: 0, max: 1, step: 0.01, label: 'border' });
    settings.addBinding(config, 'alpha', { min: 0, max: 1, step: 0.01, label: 'alpha' });
    settings.addBinding(config, 'lightness', { min: 0, max: 100, step: 1, label: 'lightness' });
    settings.addBinding(config, 'blur', { min: 0, max: 20, step: 1, label: 'input blur' });
    settings.addBinding(config, 'displace', { min: 0, max: 12, step: 0.1, label: 'output blur' });

    settings.addBinding(config, 'x', {
      label: 'channel x',
      options: { r: 'R', g: 'G', b: 'B' }
    });

    settings.addBinding(config, 'y', {
      label: 'channel y',
      options: { r: 'R', g: 'G', b: 'B' }
    });

    settings.addBinding(config, 'blend', {
      options: {
        normal: 'normal',
        multiply: 'multiply',
        screen: 'screen',
        overlay: 'overlay',
        darken: 'darken',
        lighten: 'lighten',
        'color-dodge': 'color-dodge',
        'color-burn': 'color-burn',
        'hard-light': 'hard-light',
        'soft-light': 'soft-light',
        difference: 'difference',
        exclusion: 'exclusion',
        hue: 'hue',
        saturation: 'saturation',
        color: 'color',
        luminosity: 'luminosity',
        'plus-darker': 'plus-darker',
        'plus-lighter': 'plus-lighter'
      },
      label: 'blend'
    });

    settings.addBinding(config, 'scale', { min: -1000, max: 1000, step: 1, label: 'scale' });

    const abb = settings.addFolder({ title: 'chromatic' });
    abb.addBinding(config, 'r', { min: -100, max: 100, step: 1, label: 'red' });
    abb.addBinding(config, 'g', { min: -100, max: 100, step: 1, label: 'green' });
    abb.addBinding(config, 'b', { min: -100, max: 100, step: 1, label: 'blue' });

    ctrl.on('change', sync);
  }

  const effectEl = document.querySelector('.effect');

  if (DraggableObj) {
    DraggableObj.create('.effect', { type: 'x,y' });
  }

  update();

  const initPosition = () => {
    const left = (window.innerWidth - config.width) / 2;
    const top = (window.innerHeight - config.height) / 2;
    if (gsapObj) {
      gsapObj.set('.effect', {
        top: Math.max(20, top),
        left: Math.max(20, left),
        opacity: 1
      });
    } else if (effectEl) {
      effectEl.style.top = Math.max(20, top) + 'px';
      effectEl.style.left = Math.max(20, left) + 'px';
      effectEl.style.transform = 'none';
      effectEl.style.opacity = '1';
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPosition);
  } else {
    initPosition();
  }
})();
