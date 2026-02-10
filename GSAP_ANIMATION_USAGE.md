# GSAP Scroll Animation Usage Guide

## Common Animation Function

A reusable GSAP function that animates elements from `y: 40, opacity: 0` to `y: 0, opacity: 1` with `scrub: true` enabled.

## Method 1: Using Data Attributes (Recommended)

Simply add the `data-gsap-animate` attribute to any element you want to animate:

```jsx
<div data-gsap-animate>
  Your content here
</div>
```

### Optional Data Attributes:

- `data-gsap-start` - ScrollTrigger start position (default: `'top 80%'`)
- `data-gsap-end` - ScrollTrigger end position (default: `'top 20%'`)
- `data-gsap-duration` - Animation duration in seconds (default: `1`)
- `data-gsap-y-from` - Starting y position (default: `40`)

### Examples:

```jsx
{/* Basic usage */}
<div data-gsap-animate>
  <h2>This will animate</h2>
</div>

{/* Custom start position */}
<div data-gsap-animate data-gsap-start="top 85%">
  <p>Starts animating when 85% from top</p>
</div>

{/* Custom duration */}
<div data-gsap-animate data-gsap-duration="1.5">
  <div>Slower animation (1.5 seconds)</div>
</div>

{/* Custom y position */}
<div data-gsap-animate data-gsap-y-from="60">
  <div>Starts from 60px below</div>
</div>

{/* All options */}
<div 
  data-gsap-animate 
  data-gsap-start="top 90%"
  data-gsap-end="top 10%"
  data-gsap-duration="1.2"
  data-gsap-y-from="50"
>
  <div>Fully customized animation</div>
</div>
```

## Method 2: Using the Function Directly

Import and use the function in your components:

```jsx
'use client'

import { useEffect } from 'react'
import { animateOnScroll } from '@/utils/gsapScrollAnimations'

export default function MyComponent() {
  useEffect(() => {
    // Animate single element
    const triggers = animateOnScroll('.my-element')
    
    // Animate multiple elements
    const triggers2 = animateOnScroll('.my-cards', {
      start: 'top 85%',
      duration: 1.2,
      yFrom: 50
    })
    
    return () => {
      // Cleanup (optional, handled automatically on route change)
      triggers.forEach(t => t.kill())
      triggers2.forEach(t => t.kill())
    }
  }, [])
  
  return (
    <div>
      <div className="my-element">Animated element</div>
      <div className="my-cards">Card 1</div>
      <div className="my-cards">Card 2</div>
    </div>
  )
}
```

## Function Parameters

```javascript
animateOnScroll(selector, options)
```

### Parameters:

- `selector` (string | HTMLElement | NodeList): CSS selector, element, or NodeList
- `options` (object):
  - `start` (string): ScrollTrigger start position - default: `'top 80%'`
  - `end` (string): ScrollTrigger end position - default: `'top 20%'`
  - `duration` (number): Animation duration in seconds - default: `1`
  - `yFrom` (number): Starting y position in pixels - default: `40`
  - `scrub` (boolean): Enable scrub - default: `true`

## Automatic Initialization

The animations are automatically initialized in `ScrollProvider` component, so elements with `data-gsap-animate` will animate automatically without any JavaScript code.

## Examples in Components

### WorkSection Cards:
```jsx
{workSteps.map((step, index) => (
  <div 
    key={index} 
    data-gsap-animate 
    data-gsap-duration="1"
    className="card"
  >
    {/* Card content */}
  </div>
))}
```

### Section Headers:
```jsx
<div data-gsap-animate data-gsap-duration="1.2">
  <h2>Section Title</h2>
</div>
```

### Pricing Cards:
```jsx
{pricingPlans.map((plan, index) => (
  <div 
    key={index}
    data-gsap-animate
    data-gsap-duration="1.2"
    data-gsap-start="top 85%"
  >
    {/* Card content */}
  </div>
))}
```

## Performance Notes

- ✅ Uses GPU-accelerated transforms (y, opacity)
- ✅ Scrub enabled for smooth scroll-tied animations
- ✅ Automatic cleanup on route changes
- ✅ Efficient batch processing
- ✅ Works with Lenis smooth scroll

## Best Practices

1. Use `data-gsap-animate` for simple cases
2. Use the function directly for complex scenarios
3. Set appropriate `start` positions based on viewport
4. Use shorter durations (0.8-1.2s) for better UX
5. Test on different screen sizes

