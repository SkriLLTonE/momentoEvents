/**
 * Magical Anime.js reveals for MOMENTO (spring, blur, word/letter split, stagger).
 * Classic script via global `anime` UMD — works on file:// and static servers.
 *
 * Safety: pre-hide only below-fold; never re-hide visible; forceVisible fallback.
 */
function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const api = window.anime;
  if (!api || typeof api.createTimeline !== 'function') return;

  const { createTimeline, stagger, splitText, spring } = api;

  // Softer springs — less bounce = less visual hitching
  const softSpring = spring({ bounce: 0.12, duration: 780 });
  const snappySpring = spring({ bounce: 0.16, duration: 640 });
  const lushSpring = spring({ bounce: 0.14, duration: 860 });
  const settleEase = 'out(3)';
  const richEase = 'out(4)';
  const isCompact = window.matchMedia('(max-width: 768px)').matches;
  const useBlur = !isCompact && !window.matchMedia('(max-width: 1024px) and (pointer: coarse)').matches;
  const foldLine = () => window.innerHeight * 0.85;

  function withBlur(from = 'blur(8px)') {
    return useBlur ? { filter: [from, 'blur(0px)'] } : {};
  }

  function splitChars(el) {
    if (!el) return null;
    try {
      return splitText(el, { chars: true, accessible: true });
    } catch {
      return null;
    }
  }

  function splitWords(el) {
    if (!el) return null;
    try {
      return splitText(el, {
        words: { wrap: 'clip' },
        accessible: true,
      });
    } catch {
      return null;
    }
  }

  function flatten(els) {
    const list = Array.isArray(els) ? els : [els];
    return list.filter((el) => el instanceof Element);
  }

  /** Clear inline anim styles so CSS :hover transforms still work. */
  function forceVisible(elements) {
    flatten(elements).forEach((el) => {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
      el.style.removeProperty('filter');
      el.style.removeProperty('clip-path');
      el.style.removeProperty('will-change');
    });
  }

  /** Below-fold only — soft from-state (no clip-path, mild scale). */
  function applyPreHidden(elements) {
    flatten(elements).forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translate3d(0, 36px, 0) scale(0.96)';
      if (useBlur) el.style.filter = 'blur(6px)';
      el.style.willChange = 'transform, opacity';
    });
  }

  function isBelowFold(el) {
    return Boolean(el) && el.getBoundingClientRect().top > foldLine();
  }

  function playOnEnter(target, build) {
    if (!target) return;

    const tracked = [];
    const track = (els) => {
      flatten(els).forEach((el) => {
        if (!tracked.includes(el)) tracked.push(el);
      });
    };

    try {
      const noopTl = { add() { return noopTl; } };
      build(noopTl, track);
    } catch {
      return;
    }

    if (!tracked.length) return;

    if (!isBelowFold(target)) {
      forceVisible(tracked);
      return;
    }

    applyPreHidden(tracked);

    let played = false;

    function runReveal() {
      if (played) return;
      played = true;

      try {
        const tl = createTimeline({
          autoplay: false,
          onComplete: () => forceVisible(tracked),
        });
        build(tl, track);
        tl.init();
        tl.play();
        window.setTimeout(() => forceVisible(tracked), 4200);
      } catch {
        forceVisible(tracked);
      }
    }

    if (typeof IntersectionObserver === 'undefined') {
      runReveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        runReveal();
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );

    observer.observe(target);

    window.setTimeout(() => {
      if (played) return;
      observer.disconnect();
      forceVisible(tracked);
      played = true;
    }, 12000);
  }

  function addSectionHeader(tl, track, parts) {
    const { kicker, headingWords, heading, ornament, sub } = parts;
    let started = false;

    if (kicker) {
      track(kicker);
      tl.add(kicker, {
        opacity: [0, 1],
        y: [18, 0],
        scale: [0.96, 1],
        ...withBlur('blur(6px)'),
        duration: 720,
        ease: richEase,
      });
      started = true;
    }

    if (headingWords?.length) {
      track(headingWords);
      tl.add(
        headingWords,
        {
          y: ['110%', '0%'],
          opacity: [0, 1],
          rotate: isCompact ? [0, 0] : [2.2, 0],
          scale: [0.97, 1],
          ...withBlur('blur(8px)'),
          ease: lushSpring,
        },
        stagger(52, { start: started ? '-=520' : 0, from: 'first' })
      );
      started = true;
    } else if (heading) {
      track(heading);
      tl.add(
        heading,
        {
          opacity: [0, 1],
          y: [28, 0],
          scale: [0.96, 1],
          ...withBlur('blur(8px)'),
          ease: lushSpring,
        },
        started ? '-=480' : 0
      );
      started = true;
    }

    if (ornament) {
      track(ornament);
      tl.add(
        ornament,
        {
          opacity: [0, 1],
          scale: [0.7, 1],
          y: [10, 0],
          rotate: [-8, 0],
          ease: snappySpring,
        },
        started ? '-=500' : 0
      );
      started = true;
    }

    if (sub) {
      track(sub);
      tl.add(
        sub,
        {
          opacity: [0, 1],
          y: [22, 0],
          scale: [0.98, 1],
          ...withBlur('blur(5px)'),
          duration: 820,
          ease: settleEase,
        },
        started ? '-=420' : 0
      );
    }
  }

  /* —— Hero —— */
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    const eyebrow = heroContent.querySelector('.eyebrow');
    const title = heroContent.querySelector('h1');
    const subtitle = heroContent.querySelector('h2');
    const lead = heroContent.querySelector('p');
    const cta = heroContent.querySelector('.outline-btn');
    const scrollCue = document.querySelector('.hero .scroll');
    const titleSplit = splitChars(title);
    const subtitleSplit = splitWords(subtitle);
    const heroTracked = [];

    try {
      const hero = createTimeline({
        defaults: { ease: settleEase },
        onComplete: () => forceVisible(heroTracked),
      });

      if (eyebrow) {
        heroTracked.push(eyebrow);
        hero.add(eyebrow, {
          opacity: [0, 1],
          y: [16, 0],
          scale: [0.96, 1],
          ...withBlur('blur(6px)'),
          duration: 820,
          ease: richEase,
        });
      }

      if (titleSplit?.chars?.length) {
        heroTracked.push(...titleSplit.chars);
        hero.add(
          titleSplit.chars,
          {
            y: ['0.75em', '0em'],
            opacity: [0, 1],
            scale: [0.82, 1],
            rotate: isCompact ? [0, 0] : [-5, 0],
            ...withBlur('blur(10px)'),
            ease: snappySpring,
          },
          stagger(34, { start: '-=500', from: 'center' })
        );
      } else if (title) {
        heroTracked.push(title);
        hero.add(title, {
          opacity: [0, 1],
          y: [32, 0],
          scale: [0.94, 1],
          ...withBlur('blur(8px)'),
          ease: softSpring,
        }, '-=400');
      }

      if (subtitleSplit?.words?.length) {
        heroTracked.push(...subtitleSplit.words);
        hero.add(
          subtitleSplit.words,
          {
            y: ['115%', '0%'],
            opacity: [0, 1],
            rotate: isCompact ? [0, 0] : [2.5, 0],
            scale: [0.97, 1],
            ...withBlur('blur(6px)'),
            ease: softSpring,
          },
          stagger(62, { start: '-=340' })
        );
      } else if (subtitle) {
        heroTracked.push(subtitle);
        hero.add(subtitle, {
          opacity: [0, 1],
          y: [22, 0],
          ease: softSpring,
        }, '-=280');
      }

      if (lead) {
        heroTracked.push(lead);
        hero.add(lead, {
          opacity: [0, 1],
          y: [18, 0],
          ...withBlur('blur(4px)'),
          duration: 780,
          ease: settleEase,
        }, '-=380');
      }

      if (cta) {
        heroTracked.push(cta);
        hero.add(cta, {
          opacity: [0, 1],
          y: [22, 0],
          scale: [0.94, 1],
          ease: snappySpring,
        }, '-=320');
      }

      if (scrollCue) {
        heroTracked.push(scrollCue);
        hero.add(scrollCue, {
          opacity: [0, 1],
          y: [14, 0],
          duration: 700,
          ease: settleEase,
        }, '-=240');
      }

      applyPreHidden(heroTracked);
      hero.init();
      hero.play();
      window.setTimeout(() => forceVisible(heroTracked), 4200);
    } catch {
      forceVisible([eyebrow, title, subtitle, lead, cta, scrollCue].filter(Boolean));
    }
  }

  /* —— Intro —— */
  {
    const section = document.querySelector('.intro');
    if (section) {
      const heading = section.querySelector('.heading');
      const headingSplit = splitWords(heading);
      const items = Array.from(section.querySelectorAll('.intro-item'));
      const symbols = Array.from(section.querySelectorAll('.intro-item .symbol'));

      playOnEnter(section, (tl, track) => {
        addSectionHeader(tl, track, {
          kicker: section.querySelector('.kicker'),
          headingWords: headingSplit?.words,
          heading,
          ornament: section.querySelector('.ornament'),
          sub: section.querySelector('.sub'),
        });

        if (symbols.length) {
          track(symbols);
          tl.add(
            symbols,
            {
              opacity: [0, 1],
              scale: [0.5, 1],
              rotate: [-16, 0],
              ease: snappySpring,
            },
            stagger(100, { start: '-=260', from: 'center' })
          );
        }

        if (items.length) {
          track(items);
          tl.add(
            items,
            {
              opacity: [0, 1],
              y: [36, 0],
              scale: [0.94, 1],
              rotate: (_el, i) =>
                isCompact ? [0, 0] : [i % 2 === 0 ? -2 : 2, 0],
              ...withBlur('blur(7px)'),
              ease: softSpring,
            },
            stagger(110, { start: '-=480', ease: 'in(2)' })
          );
        }
      });
    }
  }

  /* —— Programs —— */
  {
    const section = document.querySelector('.programs');
    if (section) {
      const heading = section.querySelector('.heading');
      const headingSplit = splitWords(heading);
      const cards = Array.from(section.querySelectorAll('.program-card'));
      const numbers = Array.from(section.querySelectorAll('.program-card .number'));

      playOnEnter(section, (tl, track) => {
        addSectionHeader(tl, track, {
          kicker: section.querySelector('.kicker'),
          headingWords: headingSplit?.words,
          heading,
          ornament: section.querySelector('.ornament'),
          sub: section.querySelector('.sub'),
        });

        if (cards.length) {
          track(cards);
          tl.add(
            cards,
            {
              opacity: [0, 1],
              y: [44, 0],
              scale: [0.94, 1],
              ...withBlur('blur(8px)'),
              ease: lushSpring,
            },
            stagger(100, { start: '-=300', from: 'first', ease: 'in(2)' })
          );
        }

        if (numbers.length) {
          track(numbers);
          tl.add(
            numbers,
            {
              opacity: [0, 1],
              y: [12, 0],
              ease: softSpring,
            },
            stagger(100, { start: '-=620' })
          );
        }
      });
    }
  }

  /* —— Details —— */
  {
    const section = document.querySelector('.details');
    if (section) {
      const heading = section.querySelector('.heading');
      const headingSplit = splitWords(heading);
      const features = Array.from(section.querySelectorAll('.feature'));
      const icons = Array.from(section.querySelectorAll('.feature-icon'));
      const photoAddon = section.querySelector('.photo-addon');

      playOnEnter(section, (tl, track) => {
        addSectionHeader(tl, track, {
          kicker: section.querySelector('.kicker'),
          headingWords: headingSplit?.words,
          heading,
          ornament: section.querySelector('.ornament'),
          sub: section.querySelector('.sub'),
        });

        if (icons.length) {
          track(icons);
          tl.add(
            icons,
            {
              opacity: [0, 1],
              scale: [0.55, 1],
              rotate: [-12, 0],
              ease: snappySpring,
            },
            stagger(60, { start: '-=240' })
          );
        }

        if (features.length) {
          track(features);
          tl.add(
            features,
            {
              opacity: [0, 1],
              y: [32, 0],
              scale: [0.95, 1],
              rotate: (_el, i) =>
                isCompact ? [0, 0] : [i % 2 === 0 ? -1.8 : 1.8, 0],
              ...withBlur('blur(6px)'),
              ease: softSpring,
            },
            stagger(75, { start: '-=520', ease: 'in(2)' })
          );
        }

        if (photoAddon) {
          track(photoAddon);
          tl.add(
            photoAddon,
            {
              opacity: [0, 1],
              y: [28, 0],
              scale: [0.96, 1],
              ...withBlur('blur(5px)'),
              ease: softSpring,
            },
            '-=340'
          );
        }
      });
    }
  }

  /* —— Calculator —— */
  {
    const section = document.querySelector('.calculator');
    if (section) {
      const heading = section.querySelector('.heading');
      const headingSplit = splitWords(heading);

      playOnEnter(section, (tl, track) => {
        addSectionHeader(tl, track, {
          kicker: section.querySelector('.kicker'),
          headingWords: headingSplit?.words,
          heading,
          ornament: section.querySelector('.ornament'),
          sub: section.querySelector('.sub'),
        });
      });

      const calc = section.querySelector('.calc');
      if (calc) {
        const labels = Array.from(calc.querySelectorAll('.calc-label'));
        const options = Array.from(calc.querySelectorAll('.option'));
        const durations = Array.from(calc.querySelectorAll('.duration'));
        const photoChoice = calc.querySelector('.photo-choice');
        const total = calc.querySelector('.total');
        const note = calc.querySelector('.calc-note');
        const cta = calc.querySelector('.calc-cta');

        // Animate children only — avoid parent+child double opacity fighting
        playOnEnter(calc, (tl, track) => {
          const groups = [
            ...labels,
            ...options,
            ...durations,
            photoChoice,
            total,
            note,
            cta,
          ].filter(Boolean);

          if (!groups.length) {
            track(calc);
            tl.add(calc, {
              opacity: [0, 1],
              y: [28, 0],
              scale: [0.97, 1],
              ease: softSpring,
            });
            return;
          }

          if (labels.length) {
            track(labels);
            tl.add(
              labels,
              {
                opacity: [0, 1],
                y: [14, 0],
                ease: softSpring,
              },
              stagger(140)
            );
          }

          if (options.length) {
            track(options);
            tl.add(
              options,
              {
                opacity: [0, 1],
                y: [22, 0],
                scale: [0.96, 1],
                ease: snappySpring,
              },
              stagger(65, { start: '-=560', ease: 'in(2)' })
            );
          }

          if (durations.length) {
            track(durations);
            tl.add(
              durations,
              {
                opacity: [0, 1],
                scale: [0.9, 1],
                y: [14, 0],
                ease: snappySpring,
              },
              stagger(70, { start: '-=420', from: 'center' })
            );
          }

          if (photoChoice) {
            track(photoChoice);
            tl.add(photoChoice, {
              opacity: [0, 1],
              y: [18, 0],
              ease: softSpring,
            }, '-=360');
          }

          if (total) {
            track(total);
            tl.add(total, {
              opacity: [0, 1],
              y: [16, 0],
              scale: [0.96, 1],
              ease: lushSpring,
            }, '-=320');
          }

          if (note) {
            track(note);
            tl.add(note, {
              opacity: [0, 1],
              y: [12, 0],
              duration: 680,
              ease: settleEase,
            }, '-=380');
          }

          if (cta) {
            track(cta);
            tl.add(cta, {
              opacity: [0, 1],
              y: [20, 0],
              scale: [0.95, 1],
              ease: snappySpring,
            }, '-=340');
          }
        });
      }
    }
  }

  /* —— Booking —— */
  {
    const section = document.querySelector('.booking');
    if (section) {
      const heading = section.querySelector('.heading');
      const headingSplit = splitWords(heading);

      playOnEnter(section, (tl, track) => {
        addSectionHeader(tl, track, {
          kicker: section.querySelector('.kicker'),
          headingWords: headingSplit?.words,
          heading,
          ornament: section.querySelector('.ornament'),
          sub: section.querySelector('.sub'),
        });
      });

      const form = section.querySelector('.booking-form');
      if (form) {
        const fields = Array.from(form.querySelectorAll('.field'));
        const submit = form.querySelector('.submit');
        const note = form.querySelector('.note');

        playOnEnter(form, (tl, track) => {
          if (fields.length) {
            track(fields);
            tl.add(
              fields,
              {
                opacity: [0, 1],
                y: [24, 0],
                scale: [0.97, 1],
                ease: softSpring,
              },
              stagger(65, { ease: 'in(2)' })
            );
          }

          if (submit) {
            track(submit);
            tl.add(submit, {
              opacity: [0, 1],
              y: [20, 0],
              scale: [0.95, 1],
              ease: snappySpring,
            }, '-=300');
          }

          if (note) {
            track(note);
            tl.add(note, {
              opacity: [0, 1],
              y: [12, 0],
              duration: 680,
              ease: settleEase,
            }, '-=360');
          }
        });
      }
    }
  }

  /* —— Footer —— */
  {
    const footer = document.querySelector('footer');
    if (footer) {
      const kids = Array.from(footer.children);
      playOnEnter(footer, (tl, track) => {
        track(kids);
        tl.add(
          kids,
          {
            opacity: [0, 1],
            y: [20, 0],
            scale: [0.97, 1],
            ease: softSpring,
          },
          stagger(90, { from: 'first', ease: 'in(2)' })
        );
      });
    }
  }
}

try {
  initAnimations();
} catch {
  // leave DOM visible
}
