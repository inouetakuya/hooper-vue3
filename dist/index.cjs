'use strict';

const vue = require('vue');
const Emitter = require('tiny-emitter');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const Emitter__default = /*#__PURE__*/_interopDefaultCompat(Emitter);

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function getInRange(value, min, max) {
  return Math.max(Math.min(value, max), min);
}
function now() {
  return Date.now();
}
class Timer {
  constructor(callback, defaultTime) {
    __publicField(this, "timer", null);
    __publicField(this, "defaultTime");
    __publicField(this, "callback");
    this.callback = callback;
    this.defaultTime = defaultTime;
    this.timer = this.create();
  }
  create() {
    return window.setTimeout(this.callback, this.defaultTime);
  }
  stop() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
  start() {
    if (!this.timer) {
      this.timer = this.create();
    }
  }
  set(newTime) {
    const timeout = newTime || this.defaultTime;
    this.timer = window.setTimeout(this.callback, timeout);
  }
}
function camelCaseToString(camelCase) {
  camelCase = camelCase.replace(/([A-Z]+)/g, " $1");
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}
function normalizeSlideIndex(index, slidesCount) {
  let realIndex;
  if (index < 0) {
    realIndex = (index + slidesCount) % slidesCount;
  } else {
    realIndex = index % slidesCount;
  }
  if (realIndex !== realIndex) {
    return 0;
  }
  return realIndex;
}
function normalizeChildren(context, slotProps = {}) {
  return context.$slots.default(slotProps) || [];
}

const emitter = new Emitter__default();
let EMITTER = {
  $on: (...args) => emitter.on(...args),
  $once: (...args) => emitter.on(...args),
  $off: (...args) => emitter.on(...args),
  $emit: (...args) => emitter.on(...args)
};
function renderBufferSlides(slides) {
  const before = [];
  const after = [];
  const slidesCount = slides.length;
  for (let i = 0; i < slidesCount; i++) {
    const slide = slides[i];
    const clonedBefore = vue.cloneVNode(slide);
    let slideIndex = i - slidesCount;
    clonedBefore.key = `before_${i}`;
    clonedBefore.props = {
      index: slideIndex,
      isClone: true
    };
    before.push(clonedBefore);
    const clonedAfter = vue.cloneVNode(slide);
    slideIndex = i + slidesCount;
    clonedAfter.key = `after_${slideIndex}`;
    clonedAfter.props = {
      index: slideIndex,
      isClone: true
    };
    after.push(clonedAfter);
  }
  return [...before, ...slides, ...after];
}
const Carousel = {
  name: "Hooper",
  provide() {
    return {
      $hooper: this
    };
  },
  props: {
    // count of items to showed per view
    itemsToShow: {
      default: 1,
      type: Number
    },
    // count of items to slide when use navigation buttons
    itemsToSlide: {
      default: 1,
      type: Number
    },
    // index number of initial slide
    initialSlide: {
      default: 0,
      type: Number
    },
    // control infinite scrolling mode
    infiniteScroll: {
      default: false,
      type: Boolean
    },
    // control center mode
    centerMode: {
      default: false,
      type: Boolean
    },
    // vertical sliding mode
    vertical: {
      default: false,
      type: Boolean
    },
    // enable rtl mode
    rtl: {
      default: null,
      type: Boolean
    },
    // enable auto sliding to carousel
    autoPlay: {
      default: false,
      type: Boolean
    },
    // speed of auto play to trigger slide
    playSpeed: {
      default: 2e3,
      type: Number
    },
    // toggle mouse dragging
    mouseDrag: {
      default: true,
      type: Boolean
    },
    // toggle touch dragging
    touchDrag: {
      default: true,
      type: Boolean
    },
    // toggle mouse wheel sliding
    wheelControl: {
      default: true,
      type: Boolean
    },
    // toggle keyboard control
    keysControl: {
      default: true,
      type: Boolean
    },
    // enable any move to commit a slide
    shortDrag: {
      default: true,
      type: Boolean
    },
    // sliding transition time in ms
    transition: {
      default: 300,
      type: Number
    },
    // pause autoPlay on mousehover
    hoverPause: {
      default: true,
      type: Boolean
    },
    // remove empty space around slides
    trimWhiteSpace: {
      default: false,
      type: Boolean
    },
    // an object to pass all settings
    settings: {
      default() {
        return {};
      },
      type: Object
    },
    group: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      isDragging: false,
      isSliding: false,
      isTouch: false,
      isHover: false,
      isFocus: false,
      initialized: false,
      slideWidth: 0,
      containerWidth: 0,
      containerHeight: 0,
      slideHeight: 0,
      slidesCount: 0,
      trimStart: 0,
      trimEnd: 1,
      currentSlide: null,
      timer: null,
      defaults: {},
      breakpoints: {},
      delta: { x: 0, y: 0 },
      config: {}
    };
  },
  emits: ["updated", "slide", "afterSlide", "beforeSlide", "loaded"],
  computed: {
    slideBounds() {
      const { config, currentSlide } = this;
      const siblings = config.itemsToShow;
      const lower = config.centerMode ? Math.ceil(currentSlide - siblings / 2) : currentSlide;
      const upper = config.centerMode ? Math.floor(currentSlide + siblings / 2) : Math.floor(currentSlide + siblings - 1);
      return {
        lower,
        upper
      };
    },
    trackTransform() {
      const { infiniteScroll, vertical, rtl, centerMode } = this.config;
      const direction = rtl ? -1 : 1;
      const slideLength = vertical ? this.slideHeight : this.slideWidth;
      const containerLength = vertical ? this.containerHeight : this.containerWidth;
      const dragDelta = vertical ? this.delta.y : this.delta.x;
      const clonesSpace = infiniteScroll ? slideLength * this.slidesCount : 0;
      const centeringSpace = centerMode ? (containerLength - slideLength) / 2 : 0;
      const translate = dragDelta + direction * (centeringSpace - clonesSpace - this.currentSlide * slideLength);
      if (vertical) {
        return `transform: translate(0, ${translate}px);`;
      }
      return `transform: translate(${translate}px, 0);`;
    },
    trackTransition() {
      if (this.initialized && this.isSliding) {
        return `transition: ${this.config.transition}ms`;
      }
      return "";
    }
  },
  watch: {
    group(val, oldVal) {
      if (val === oldVal) {
        return;
      }
      EMITTER.$off(`slideGroup:${oldVal}`, this._groupSlideHandler);
      this.addGroupListeners();
    },
    autoPlay(val, oldVal) {
      if (val === oldVal) {
        return;
      }
      this.restartTimer();
    }
  },
  methods: {
    // controlling methods
    slideTo(slideIndex, isSource = true) {
      if (this.isSliding || slideIndex === this.currentSlide) {
        return;
      }
      const { infiniteScroll, transition } = this.config;
      const index = infiniteScroll ? slideIndex : getInRange(
        slideIndex,
        this.trimStart,
        this.slidesCount - this.trimEnd
      );
      this.$emit("beforeSlide", {
        currentSlide: this.currentSlide,
        slideTo: index
      });
      const previousSlide = this.currentSlide;
      if (this.group && isSource) {
        EMITTER.$emit(`slideGroup:${this.group}`, slideIndex);
      }
      this.currentSlide = index;
      this.isSliding = true;
      window.setTimeout(() => {
        this.isSliding = false;
        this.currentSlide = normalizeSlideIndex(index, this.slidesCount);
      }, transition);
      this.$emit("slide", {
        currentSlide: this.currentSlide,
        slideFrom: previousSlide
      });
    },
    slideNext() {
      this.slideTo(this.currentSlide + this.config.itemsToSlide);
    },
    slidePrev() {
      this.slideTo(this.currentSlide - this.config.itemsToSlide);
    },
    initEvents() {
      if (this.defaults.rtl === null) {
        this.defaults.rtl = getComputedStyle(this.$el).direction === "rtl";
      }
      if (this.$props.autoPlay) {
        this.initAutoPlay();
      }
      if (this.config.keysControl) {
        this.$el.addEventListener("keydown", this.onKeypress);
      }
      if (this.config.wheelControl) {
        this.lastScrollTime = now();
        this.$el.addEventListener("wheel", this.onWheel, { passive: false });
      }
      window.addEventListener("resize", this.update);
    },
    getCurrentSlideTimeout() {
      const curIdx = normalizeSlideIndex(this.currentSlide, this.slidesCount);
      const normalizedchildren = normalizeChildren(this);
      const children = typeof normalizedchildren[0]?.type === "symbol" ? normalizedchildren[0].children : normalizedchildren;
      return children[curIdx].props?.duration ?? this.playSpeed;
    },
    // switched to using a timeout which defaults to the prop set on this component, but can be overridden on a per slide basis.
    initAutoPlay() {
      this.timer = new Timer(() => {
        if (this.isSliding || this.isDragging || this.isHover && this.config.hoverPause || this.isFocus || !this.$props.autoPlay) {
          this.timer.set(this.getCurrentSlideTimeout());
          return;
        }
        if (this.currentSlide === this.slidesCount - 1 && !this.config.infiniteScroll) {
          this.slideTo(0);
          this.timer.set(this.getCurrentSlideTimeout());
          return;
        }
        this.slideNext();
        this.timer.set(this.getCurrentSlideTimeout());
      }, this.getCurrentSlideTimeout());
    },
    initDefaults() {
      this.breakpoints = this.settings.breakpoints;
      this.defaults = Object.assign({}, this.$props, this.settings);
      this.config = Object.assign({}, this.defaults);
    },
    // updating methods
    update() {
      if (this.breakpoints) {
        this.updateConfig();
      }
      this.updateWidth();
      this.updateTrim();
      this.$emit("updated", {
        containerWidth: this.containerWidth,
        containerHeight: this.containerHeight,
        slideWidth: this.slideWidth,
        slideHeight: this.slideHeight,
        settings: this.config
      });
    },
    updateTrim() {
      const { trimWhiteSpace, itemsToShow, centerMode, infiniteScroll } = this.config;
      if (!trimWhiteSpace || infiniteScroll) {
        this.trimStart = 0;
        this.trimEnd = 1;
        return;
      }
      this.trimStart = centerMode ? Math.floor((itemsToShow - 1) / 2) : 0;
      this.trimEnd = centerMode ? Math.ceil(itemsToShow / 2) : itemsToShow;
    },
    updateWidth() {
      const rect = this.$el.getBoundingClientRect();
      this.containerWidth = rect.width;
      this.containerHeight = rect.height;
      if (this.config.vertical) {
        this.slideHeight = this.containerHeight / this.config.itemsToShow;
        return;
      }
      this.slideWidth = this.containerWidth / this.config.itemsToShow;
    },
    updateConfig() {
      const breakpoints = Object.keys(this.breakpoints).sort((a, b) => b - a);
      let matched;
      breakpoints.some((breakpoint) => {
        matched = window.matchMedia(`(min-width: ${breakpoint}px)`).matches;
        if (matched) {
          this.config = Object.assign(
            {},
            this.config,
            this.defaults,
            this.breakpoints[breakpoint]
          );
          return true;
        }
      });
      if (!matched) {
        this.config = Object.assign(this.config, this.defaults);
      }
    },
    restartTimer() {
      vue.nextTick(() => {
        if (this.timer === null && this.$props.autoPlay) {
          this.initAutoPlay();
          return;
        }
        if (this.timer) {
          this.timer.stop();
          if (this.$props.autoPlay) {
            this.timer.set(this.getCurrentSlideTimeout());
            this.timer.start();
          }
        }
      });
    },
    restart() {
      vue.nextTick(() => {
        this.update();
      });
    },
    // events handlers
    onDragStart(event) {
      this.isTouch = event.type === "touchstart";
      if (!this.isTouch && event.button !== 0) {
        return;
      }
      this.startPosition = { x: 0, y: 0 };
      this.endPosition = { x: 0, y: 0 };
      this.isDragging = true;
      this.startPosition.x = this.isTouch ? event.touches[0].clientX : event.clientX;
      this.startPosition.y = this.isTouch ? event.touches[0].clientY : event.clientY;
      document.addEventListener(
        this.isTouch ? "touchmove" : "mousemove",
        this.onDrag
      );
      document.addEventListener(
        this.isTouch ? "touchend" : "mouseup",
        this.onDragEnd
      );
    },
    isInvalidDirection(deltaX, deltaY) {
      if (!this.config.vertical) {
        return Math.abs(deltaX) <= Math.abs(deltaY);
      }
      if (this.config.vertical) {
        return Math.abs(deltaY) <= Math.abs(deltaX);
      }
      return false;
    },
    onDrag(event) {
      if (this.isSliding) {
        return;
      }
      this.endPosition.x = this.isTouch ? event.touches[0].clientX : event.clientX;
      this.endPosition.y = this.isTouch ? event.touches[0].clientY : event.clientY;
      const deltaX = this.endPosition.x - this.startPosition.x;
      const deltaY = this.endPosition.y - this.startPosition.y;
      if (this.isInvalidDirection(deltaX, deltaY)) {
        return;
      }
      this.delta.y = deltaY;
      this.delta.x = deltaX;
      if (!this.isTouch) {
        event.preventDefault();
      }
    },
    onDragEnd() {
      const tolerance = this.config.shortDrag ? 0.5 : 0.15;
      this.isDragging = false;
      if (this.config.vertical) {
        const draggedSlides = Math.round(
          Math.abs(this.delta.y / this.slideHeight) + tolerance
        );
        this.slideTo(
          this.currentSlide - Math.sign(this.delta.y) * draggedSlides
        );
      }
      if (!this.config.vertical) {
        const direction = (this.config.rtl ? -1 : 1) * Math.sign(this.delta.x);
        const draggedSlides = Math.round(
          Math.abs(this.delta.x / this.slideWidth) + tolerance
        );
        this.slideTo(this.currentSlide - direction * draggedSlides);
      }
      this.delta.x = 0;
      this.delta.y = 0;
      document.removeEventListener(
        this.isTouch ? "touchmove" : "mousemove",
        this.onDrag
      );
      document.removeEventListener(
        this.isTouch ? "touchend" : "mouseup",
        this.onDragEnd
      );
      this.restartTimer();
    },
    onTransitionend() {
      this.isSliding = false;
      this.$emit("afterSlide", {
        currentSlide: this.currentSlide
      });
    },
    onKeypress(event) {
      const key = event.key;
      if (key.startsWith("Arrow")) {
        event.preventDefault();
      }
      if (this.config.vertical) {
        if (key === "ArrowUp") {
          this.slidePrev();
        }
        if (key === "ArrowDown") {
          this.slideNext();
        }
        return;
      }
      if (this.config.rtl) {
        if (key === "ArrowRight") {
          this.slidePrev();
        }
        if (key === "ArrowLeft") {
          this.slideNext();
        }
        return;
      }
      if (key === "ArrowRight") {
        this.slideNext();
      }
      if (key === "ArrowLeft") {
        this.slidePrev();
      }
    },
    onWheel(event) {
      event.preventDefault();
      if (now() - this.lastScrollTime < 200) {
        return;
      }
      this.lastScrollTime = now();
      const value = event.wheelDelta || -event.deltaY;
      const delta = Math.sign(value);
      if (delta === -1) {
        this.slideNext();
      }
      if (delta === 1) {
        this.slidePrev();
      }
    },
    addGroupListeners() {
      if (!this.group) {
        return;
      }
      this._groupSlideHandler = (slideIndex) => {
        this.slideTo(slideIndex, false);
      };
      EMITTER.$on(`slideGroup:${this.group}`, this._groupSlideHandler);
    },
    renderSlides() {
      const children = normalizeChildren(this);
      const childrenCount = children.length;
      let idx = 0;
      let slides = [];
      for (let i = 0; i < childrenCount; i++) {
        const child = children[i];
        if (!child) {
          continue;
        }
        if (typeof child.type === "symbol") {
          child.children.forEach((c) => {
            if (c.type.name !== "HooperSlide") {
              return;
            }
            slides.push({
              ...c,
              key: idx,
              props: {
                ...c.props || {},
                isClone: false,
                index: idx++
              }
            });
          });
          continue;
        }
        if (child.type.name !== "HooperSlide") {
          continue;
        }
        slides.push({
          ...child,
          key: idx,
          props: {
            ...child.props || {},
            isClone: false,
            index: idx++
          }
        });
      }
      this.slidesCount = slides.length;
      if (this.config.infiniteScroll) {
        slides = renderBufferSlides(slides);
      }
      return vue.h(
        "ul",
        {
          class: {
            "hooper-track": true,
            "is-dragging": this.isDragging
          },
          style: this.trackTransform + this.trackTransition,
          ref: "track",
          onTransitionend: this.onTransitionend,
          onMousedown: this.config.mouseDrag ? this.onDragStart.bind(this) : void 0,
          onTouchstart: this.config.mouseDrag ? this.onDragStart.bind(this) : void 0
        },
        slides
      );
    },
    renderBody() {
      const slides = this.renderSlides();
      const addons = this.$slots["hooper-addons"] && this.$slots["hooper-addons"]() || [];
      const a11y = vue.h(
        "div",
        {
          class: "hooper-liveregion hooper-sr-only",
          "aria-live": "polite",
          "aria-atomic": "true"
        },
        `Item ${this.currentSlide + 1} of ${this.slidesCount}`
      );
      const children = [...addons, a11y];
      return [
        vue.h(
          "div",
          {
            class: "hooper-list",
            ref: "list"
          },
          slides
        ),
        children
      ];
    }
  },
  created() {
    this.initDefaults();
  },
  mounted() {
    this.initEvents();
    this.addGroupListeners();
    vue.nextTick(() => {
      this.update();
      this.slideTo(this.config.initialSlide || 0);
      vue.nextTick(() => {
        this.update();
      });
      setTimeout(() => {
        this.$emit("loaded");
        this.initialized = true;
      }, this.transition);
    });
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.update);
    if (this.group) {
      EMITTER.$off(`slideGroup:${this.group}`, this._groupSlideHandler);
    }
    if (this.timer) {
      this.timer.stop();
    }
  },
  render() {
    const body = this.renderBody();
    return vue.h(
      "section",
      {
        tabindex: "0",
        class: {
          hooper: true,
          "is-vertical": this.config.vertical,
          "is-rtl": this.config.rtl
        },
        onFocusin: () => this.isFocus = true,
        onFocusout: () => this.isFocus = false,
        onMouseover: () => this.isHover = true,
        onMouseleave: () => this.isHover = false
      },
      body
    );
  }
};

const Slide = vue.defineComponent({
  name: "HooperSlide",
  inject: ["$hooper"],
  props: {
    isClone: {
      type: Boolean,
      default: false
    },
    index: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    }
  },
  computed: {
    style() {
      const { config, slideHeight, slideWidth } = this.$hooper || {};
      if (config.vertical) {
        return `height: ${slideHeight}px`;
      }
      return `width: ${slideWidth}px`;
    },
    isActive() {
      const { upper, lower } = this.$hooper.slideBounds;
      return this.index >= lower && this.index <= upper;
    },
    isPrev() {
      const { lower } = this.$hooper.slideBounds;
      const { itemsToSlide } = this.$hooper.config;
      return this.index < lower && this.index >= lower - itemsToSlide;
    },
    isNext() {
      const { upper } = this.$hooper.slideBounds;
      const { itemsToSlide } = this.$hooper.config;
      return this.index > upper && this.index <= upper + itemsToSlide;
    },
    isCurrent() {
      return this.index === this.$hooper.currentSlide;
    }
  },
  render() {
    const classes = {
      "hooper-slide": true,
      "is-clone": this.isClone,
      "is-active": this.isActive,
      "is-prev": this.isPrev,
      "is-next": this.isNext,
      "is-current": this.isCurrent
    };
    const children = normalizeChildren(this);
    return vue.h(
      "li",
      {
        class: classes,
        style: this.style,
        "aria-hidden": this.isActive
      },
      children
    );
  }
});

const Mixin = {
  inject: ["$hooper"]
};

const icons = {
  arrowUp: "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z",
  arrowDown: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  arrowRight: "M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z",
  arrowLeft: "M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"
};
const Icon = vue.defineComponent({
  name: "HooperIcon",
  functional: true,
  inheritAttrs: true,
  props: {
    name: {
      type: String,
      required: true,
      validator: (val) => val in icons
    }
  },
  render() {
    const icon = icons[this.name];
    const children = [];
    children.push(vue.h("title", camelCaseToString(this.name)));
    children.push(
      vue.h("path", {
        d: "M0 0h24v24H0z",
        fill: "none"
      })
    );
    children.push(
      vue.h("path", {
        d: icon
      })
    );
    return vue.h(
      "svg",
      {
        class: `icon icon-${this.name}`,
        viewBox: "0 0 24 24",
        width: "24px",
        height: "24px"
      },
      children
    );
  }
});

const Progress = vue.defineComponent({
  inject: ["$hooper"],
  name: "HooperProgress",
  computed: {
    currentSlide() {
      return normalizeSlideIndex(
        this.$hooper.currentSlide,
        this.$hooper.slidesCount
      );
    },
    progress() {
      const range = this.$hooper.slidesCount - this.$hooper.trimStart - this.$hooper.trimEnd;
      return (this.currentSlide - this.$hooper.trimStart) * 100 / range;
    }
  },
  render() {
    return vue.h("div", { class: "hooper-progress" }, [
      vue.h("div", {
        class: "hooper-progress-inner",
        style: `width: ${this.progress}%`
      })
    ]);
  }
});

function renderFraction(current, totalCount) {
  return [vue.h("span", current + 1), vue.h("span", "/"), vue.h("span", totalCount)];
}
function renderIndicator(index, isCurrent, onClick) {
  return vue.h("li", [
    vue.h(
      "button",
      {
        class: { "hooper-indicator": true, "is-active": isCurrent },
        type: "button",
        onClick
      },
      [vue.h("span", { class: "hooper-sr-only" }, `item ${index}`)]
    )
  ]);
}
function renderDefault(current, totalCount, slideToIndex) {
  const children = [];
  for (let i = 0; i < totalCount; i++) {
    children.push(renderIndicator(i, i === current, () => slideToIndex(i)));
  }
  return [
    vue.h(
      "ol",
      {
        class: "hooper-indicators"
      },
      children
    )
  ];
}
const Pagination = vue.defineComponent({
  inject: ["$hooper"],
  name: "HooperPagination",
  props: {
    mode: {
      default: "indicator",
      type: String
    }
  },
  computed: {
    currentSlide() {
      return normalizeSlideIndex(
        this.$hooper.currentSlide,
        this.$hooper.slidesCount
      );
    },
    slides() {
      const slides = this.$hooper.slides.map((_, index) => index);
      return slides.slice(
        this.$hooper.trimStart,
        this.$hooper.slidesCount - this.$hooper.trimEnd + 1
      );
    }
  },
  render() {
    const totalCount = this.$hooper.slidesCount;
    const children = this.mode === "indicator" ? renderDefault(
      this.currentSlide,
      totalCount,
      (index) => this.$hooper.slideTo(index)
    ) : renderFraction(this.currentSlide, totalCount);
    return vue.h(
      "div",
      {
        class: {
          "hooper-pagination": true,
          "is-vertical": this.$hooper.config.vertical
        }
      },
      children
    );
  }
});

function iconName(isVertical, isRTL, isPrev) {
  if (isPrev) {
    return isVertical ? "arrowUp" : isRTL ? "arrowRight" : "arrowLeft";
  }
  return isVertical ? "arrowDown" : isRTL ? "arrowLeft" : "arrowRight";
}
function renderButton(disabled, slot, isPrev, { isVertical, isRTL }, onClick) {
  const children = slot && slot.length ? slot() : [
    vue.h(Icon, {
      name: iconName(isVertical, isRTL, isPrev)
    })
  ];
  return vue.h(
    "button",
    {
      class: {
        [`hooper-${isPrev ? "prev" : "next"}`]: true,
        "is-disabled": disabled
      },
      type: "button",
      onClick
    },
    children
  );
}
const Navigation = vue.defineComponent({
  inject: ["$hooper"],
  name: "HooperNavigation",
  computed: {
    isPrevDisabled() {
      if (this.$hooper.config.infiniteScroll) {
        return false;
      }
      return this.$hooper.currentSlide === 0;
    },
    isNextDisabled() {
      if (this.$hooper.config.infiniteScroll) {
        return false;
      }
      if (this.$hooper.config.trimWhiteSpace) {
        return this.$hooper.currentSlide === this.$hooper.slidesCount - Math.min(this.$hooper.config.itemsToShow, this.$hooper.slidesCount);
      }
      return this.$hooper.currentSlide === this.$hooper.slidesCount - 1;
    }
  },
  methods: {
    slideNext() {
      this.$hooper.slideNext();
      this.$hooper.restartTimer();
    },
    slidePrev() {
      this.$hooper.slidePrev();
      this.$hooper.restartTimer();
    }
  },
  render() {
    const config = {
      isRTL: this.$hooper.config.rtl,
      isVertical: this.$hooper.config.vertical
    };
    const children = [
      renderButton(
        this.isPrevDisabled,
        this.$slots["hooper-prev"],
        true,
        config,
        () => this.slidePrev()
      ),
      renderButton(
        this.isNextDisabled,
        this.$slots["hooper-next"],
        false,
        config,
        () => this.slideNext()
      )
    ];
    return vue.h(
      "div",
      {
        class: {
          "hooper-navigation": true,
          "is-vertical": this.$hooper.config.vertical,
          "is-rtl": this.$hooper.config.rtl
        }
      },
      children
    );
  }
});

exports.Hooper = Carousel;
exports.Icon = Icon;
exports.Navigation = Navigation;
exports.Pagination = Pagination;
exports.Progress = Progress;
exports.Slide = Slide;
exports.addonMixin = Mixin;
