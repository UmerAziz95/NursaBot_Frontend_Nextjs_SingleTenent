'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugin safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Track initialized elements to prevent duplicates (without DOM attributes)
const initializedElements = new WeakSet()

/* --------------------------------------------------
  Animation Variants (Motion Language)
-------------------------------------------------- */
const animationVariants = {
  'fade-up': {
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
  },
  'fade-down': {
    from: { opacity: 0, y: -40 },
    to: { opacity: 1, y: 0 },
  },
  'slide-left': {
    from: { opacity: 0, x: 60 },
    to: { opacity: 1, x: 0 },
  },
  'slide-right': {
    from: { opacity: 0, x: -60 },
    to: { opacity: 1, x: 0 },
  },
  'fade-scale': {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  },
  'soft-pop': {
    from: { opacity: 0, scale: 0.9, y: 20 },
    to: {
      opacity: 1,
      scale: 1,
      y: 0,
      ease: 'elastic.out(1, 0.6)',
    },
  },
  'blur-in': {
    from: { opacity: 0, y: 20, filter: 'blur(12px)' },
    to: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  'parallax': {
    from: { y: -60 },
    to: { y: 60 },
  },
}

/* --------------------------------------------------
  Core Animation Function
-------------------------------------------------- */
export function animateOnScroll(selector, options = {}) {
  if (typeof window === 'undefined') return []

  const {
    start = 'top 85%',
    end = 'top 60%',
    duration = 1,
    scrub = true,
    stagger = 0,
    delay = 0,
    variant = 'fade-up',
    markers = false,
  } = options

  let elements

  if (typeof selector === 'string') {
    elements = document.querySelectorAll(selector)
  } else if (selector instanceof HTMLElement) {
    elements = [selector]
  } else if (selector instanceof NodeList || Array.isArray(selector)) {
    elements = selector
  } else {
    return []
  }

  if (!elements.length) return []

  const config = animationVariants[variant] || animationVariants['fade-up']

  gsap.set(elements, config.from)

  const tween = gsap.to(elements, {
    ...config.to,
    duration,
    delay,
    stagger,
    ease: scrub ? 'none' : 'power3.out',
  })

  const trigger = ScrollTrigger.create({
    trigger: elements[0],
    start,
    end,
    animation: tween,
    scrub,
    markers,
  })

  return [trigger]
}

/* --------------------------------------------------
  Auto Init via Data Attributes
-------------------------------------------------- */
export function initScrollAnimations() {
  if (typeof window === 'undefined') return

  // Get all elements with data-gsap-animate attribute
  const elements = document.querySelectorAll('[data-gsap-animate]')
  if (!elements.length) return

   elements.forEach((el) => {
     // Skip if already initialized (using WeakSet to avoid DOM attribute - prevents hydration mismatch)
     if (initializedElements.has(el)) return
     
     // Mark as initialized using WeakSet (no DOM modification)
     initializedElements.add(el)

     const variant = el.dataset.gsapVariant || 'fade-up'
     const start = el.dataset.gsapStart || 'top 85%'
     const end = el.dataset.gsapEnd || 'top 60%'
     const duration = parseFloat(el.dataset.gsapDuration) || 1
     const scrub = el.dataset.gsapScrub !== 'false' // Default to true, only false if explicitly set
     const delay = parseFloat(el.dataset.gsapDelay) || 0

    const config = animationVariants[variant] || animationVariants['fade-up']

    // Use triple requestAnimationFrame to ensure React hydration is fully complete
    // This prevents hydration mismatches by waiting for React to finish rendering
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Create the tween
          const tween = gsap.to(el, {
            ...config.to,
            duration,
            delay,
            ease: scrub ? 'none' : 'power3.out',
          })

          // Check if element is below the fold (not visible)
          // Only set initial state for elements below the fold to prevent hydration mismatch
          const checkAndSetInitialState = () => {
            const rect = el.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const isBelowFold = rect.top > viewportHeight || rect.bottom < 0
            
            if (isBelowFold) {
              gsap.set(el, config.from)
              return true
            }
            return false
          }

          // Set initial state only if element is below fold
          const hasInitialState = checkAndSetInitialState()

          ScrollTrigger.create({
            trigger: el,
            start,
            end,
            animation: tween,
            scrub,
            markers: false,
            // Set initial state when entering trigger zone if not already set
            onEnter: () => {
              if (!hasInitialState) {
                gsap.set(el, config.from)
              }
            },
            onRefresh: () => {
              checkAndSetInitialState()
              tween.progress(0)
            },
          })
        })
      })
    })
  })
}

/* --------------------------------------------------
  Cleanup (for route change / unmount)
-------------------------------------------------- */
export function cleanupScrollAnimations() {
  if (typeof window === 'undefined') return

  ScrollTrigger.getAll().forEach((trigger) => {
    trigger.kill()
  })
}
