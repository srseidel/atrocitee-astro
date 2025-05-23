# Atrocitee MVP Style Guide

This style guide serves as the definitive reference for the Atrocitee MVP's design system. It implements a clean, modern aesthetic with a focus on readability and brand identity.

## Brand Identity

### Brand Name and Slogan

| Element | Value | Usage |
|---------|-------|-------|
| Brand Name | Atrocitee | Use in all brand communications and marketing materials |
| Slogan | Threads of Change | Use as a tagline in hero sections, marketing materials, and where appropriate |

The slogan "Threads of Change" encapsulates our mission of using fashion as a vehicle for social and political impact.

## Color System

### Primary Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|--------------|-------|
| Primary Blue | `#0594CB` | `text-primary`, `bg-primary`, `border-primary` | Primary actions, links, brand identity |
| Primary Light | `#55acee` | `text-primary-light`, `bg-primary-light`, `border-primary-light` | Hover states, backgrounds, accents |
| Primary Dark | `#0077b5` | `text-primary-dark`, `bg-primary-dark`, `border-primary-dark` | Active states, text on light backgrounds |

### Secondary Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|--------------|-------|
| Secondary Pink | `#FF4088` | `text-secondary`, `bg-secondary`, `border-secondary` | Secondary actions, highlights, gradients |
| Secondary Light | `#ff6ba8` | `text-secondary-light`, `bg-secondary-light`, `border-secondary-light` | Hover states, soft backgrounds |
| Secondary Dark | `#cc3366` | `text-secondary-dark`, `bg-secondary-dark`, `border-secondary-dark` | Active states, text on light backgrounds |

### Accent Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|--------------|-------|
| Accent Cyan | `#00ADD8` | `text-accent`, `bg-accent`, `border-accent` | Tertiary actions, highlights, special features |
| Teal (from original) | `#4DB6AC` | `text-teal`, `bg-teal`, `border-teal` | Charity-related elements, impact metrics |
| Orange (from original) | `#FF9800` | `text-orange`, `bg-orange`, `border-orange` | Call-to-actions, important highlights |

### Neutral Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|--------------|-------|
| White | `#FFFFFF` | `text-white`, `bg-white`, `border-white` | Backgrounds, cards |
| Neutral 50 | `#fafafa` | `text-neutral-50`, `bg-neutral-50`, `border-neutral-50` | Alternative backgrounds |
| Neutral 100 | `#f5f5f5` | `text-neutral-100`, `bg-neutral-100`, `border-neutral-100` | Borders, dividers, subtle backgrounds |
| Neutral 200 | `#e5e5e5` | `text-neutral-200`, `bg-neutral-200`, `border-neutral-200` | Borders, dividers |
| Neutral 300 | `#d4d4d4` | `text-neutral-300`, `bg-neutral-300`, `border-neutral-300` | Disabled elements |
| Neutral 400 | `#a3a3a3` | `text-neutral-400`, `bg-neutral-400`, `border-neutral-400` | Placeholder text |
| Neutral 500 | `#737373` | `text-neutral-500`, `bg-neutral-500`, `border-neutral-500` | Secondary text |
| Neutral 600 | `#525252` | `text-neutral-600`, `bg-neutral-600`, `border-neutral-600` | Secondary text, strong |
| Neutral 700 | `#404040` | `text-neutral-700`, `bg-neutral-700`, `border-neutral-700` | Primary text |
| Neutral 800 | `#262626` | `text-neutral-800`, `bg-neutral-800`, `border-neutral-800` | Headings |
| Neutral 900 | `#171717` | `text-neutral-900`, `bg-neutral-900`, `border-neutral-900` | Heavy emphasis text |

### Functional Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|--------------|-------|
| Success | `#18B566` | `text-success`, `bg-success`, `border-success` | Success messages, confirmations |
| Warning | `#FFB238` | `text-warning`, `bg-warning`, `border-warning` | Warnings, cautionary messages |
| Error | `#E02C2C` | `text-error`, `bg-error`, `border-error` | Error messages, destructive actions |
| Info | `#0594CB` | `text-info`, `bg-info`, `border-info` | Informational messages |

### Documentation-Style Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|--------------|-------|
| Docs Sidebar | `#f5f7f9` | `text-docs-sidebar`, `bg-docs-sidebar`, `border-docs-sidebar` | Sidebar backgrounds, secondary content areas |
| Docs Border | `#e6ecf1` | `text-docs-border`, `bg-docs-border`, `border-docs-border` | Borders for documentation elements |
| Docs Highlight | `#fff8e6` | `text-docs-highlight`, `bg-docs-highlight`, `border-docs-highlight` | Highlighted content, notes, important info |

## Typography

### Font Families

| Font Usage | Font Stack | Tailwind Class |
|------------|------------|--------------|
| Base Text | `'Varela Round', system-ui, -apple-system, sans-serif` | `font-base` |
| Headings | `'Varela Round', system-ui, -apple-system, sans-serif` | `font-heading` |
| Monospace | `'Fira Mono', 'SFMono-Regular', Consolas, monospace` | `font-mono` |
| Small Caps | `'Varela Round', system-ui, -apple-system, sans-serif` | `font-small-caps` |

We use Varela Round as our primary font throughout the application for its excellent readability and friendly, approachable character that aligns with our brand values.

### Small Caps

For small caps text, use the `.small-caps` utility class:

```html
<span class="small-caps font-small-caps">Small Caps Text</span>
```

This applies the font-variant small-caps property with a slight letter spacing adjustment for better readability.

### Font Sizes

We use a modular scale for typography to maintain visual hierarchy and consistency:

| Element | Size (rem) | Weight | Line Height | Usage |
|---------|------------|--------|-------------|-------|
| h1 | 2.25rem (36px) | 700 | 1.2 | Main page headings |
| h2 | 1.75rem (28px) | 600 | 1.2 | Section headings |
| h3 | 1.375rem (22px) | 600 | 1.2 | Subsection headings |
| h4 | 1.125rem (18px) | 600 | 1.2 | Minor headings |
| Body | 1rem (16px) | 400 | 1.6 | Main text content |
| Small | 0.875rem (14px) | 400 | 1.5 | Secondary information |
| XS | 0.75rem (12px) | 400 | 1.5 | Legal text, footnotes |

### Heading Utility Classes

We provide utility classes for common heading styles:

```html
<h2 class="heading-lg">Large Heading</h2>
<h3 class="heading-md">Medium Heading</h3>
<h4 class="heading-sm">Small Heading</h4>
```

## Spacing System

We use a consistent spacing scale throughout the application:

| Name | Size (rem) | Pixels | Usage |
|------|------------|--------|-------|
| Space 1 | 0.25rem | 4px | Minimal spacing between related elements |
| Space 2 | 0.5rem | 8px | Inner padding for compact elements |
| Space 3 | 0.75rem | 12px | Spacing between related elements |
| Space 4 | 1rem | 16px | Standard spacing, padding |
| Space 5 | 1.25rem | 20px | Medium spacing |
| Space 6 | 1.5rem | 24px | Standard section padding |
| Space 8 | 2rem | 32px | Generous spacing between sections |
| Space 10 | 2.5rem | 40px | Large spacing for visual hierarchy |
| Space 12 | 3rem | 48px | Section margins |
| Space 16 | 4rem | 64px | Large section padding |
| Space 20 | 5rem | 80px | Extra large vertical spacing |
| Space 24 | 6rem | 96px | Maximum spacing for major sections |

## Components

### Buttons

The Atrocitee design system features several button variants:

#### Primary Button
```html
<button class="btn btn-primary">Shop Now</button>
```

#### Secondary Button
```html
<button class="btn btn-secondary">Learn More</button>
```

#### Large Button
```html
<button class="btn btn-primary btn-lg">Get Started</button>
```

#### Original Brand Buttons
```html
<button class="btn btn-teal">Teal Button</button>
<button class="btn btn-orange">Orange Button</button>
```

#### Text Button
```html
<button class="btn-text">View Details</button>
```

#### Disabled Button
```html
<button class="btn btn-primary btn-disabled">Sold Out</button>
```

### Cards

Cards are used to display content in contained, visually separate sections:

#### Basic Card
```html
<div class="card">
  <div class="card-body">
    <h3 class="text-xl font-bold mb-2">Card Title</h3>
    <p class="text-neutral-600">Card content goes here.</p>
  </div>
</div>
```

#### Card with Header
```html
<div class="card">
  <div class="card-header">Card Title</div>
  <div class="card-body">
    <p class="text-neutral-600">Card content goes here.</p>
  </div>
</div>
```

#### Product Card
```html
<div class="product-card group">
  <div class="product-img-container">
    <img src="/product-image.jpg" alt="Product" class="product-img" />
    <!-- Optional badge -->
    <div class="product-badge">New</div>
  </div>
  <div class="product-info">
    <h3 class="product-title">Product Name</h3>
    <p class="text-sm text-neutral-600 mb-4">Product description here.</p>
    <div class="flex justify-between items-center">
      <span class="product-price">$29.99</span>
      <div class="product-charity">Supports: Climate Action</div>
    </div>
    <button class="btn btn-primary w-full mt-4">Add to Cart</button>
  </div>
</div>
```

### Form Elements

#### Input Field
```html
<div class="form-group">
  <label for="email" class="form-label">Email Address</label>
  <input 
    type="email" 
    id="email" 
    class="form-input"
    placeholder="Your email" 
  />
</div>
```

#### Form Validation - Error State
```html
<div class="form-group">
  <label for="password" class="form-label text-error">Password</label>
  <input 
    type="password" 
    id="password"
    class="form-input form-input-error" 
  />
  <p class="form-error">Password must be at least 8 characters</p>
</div>
```

#### Form Validation - Success State
```html
<div class="form-group">
  <label for="username" class="form-label text-success">Username</label>
  <input 
    type="text" 
    id="username"
    value="activista"
    class="form-input form-input-success" 
  />
  <p class="form-success">Username is available</p>
</div>
```

### Alerts

#### Documentation-Style Alerts
```html
<div class="alert alert-info">
  <strong>Info alert:</strong> This is an information message.
</div>

<div class="alert alert-success">
  <strong>Success alert:</strong> Operation completed successfully.
</div>

<div class="alert alert-warning">
  <strong>Warning alert:</strong> Proceed with caution.
</div>

<div class="alert alert-error">
  <strong>Error alert:</strong> Something went wrong.
</div>
```

#### Brand-Style Alerts
```html
<div class="alert-brand-error">
  <div class="flex">
    <div class="ml-3">
      <p class="font-medium">Payment failed. Please check your card details.</p>
    </div>
  </div>
</div>

<div class="alert-brand-success">
  <div class="flex">
    <div class="ml-3">
      <p class="font-medium">Order placed successfully. Thank you for your support!</p>
    </div>
  </div>
</div>
```

### Charity Elements

#### Charity Badge
```html
<div class="charity-badge">
  <div class="charity-logo">
    <img src="/charity-logo.png" alt="Charity Name" class="w-full h-full object-cover" />
  </div>
  <div>
    <p class="charity-text-small">10% supports</p>
    <p class="charity-text-name">Charity Name</p>
  </div>
</div>
```

#### Impact Counter
```html
<div class="impact-counter">
  <h2 class="impact-counter-title">Our Collective Impact</h2>
  <p class="impact-counter-subtitle">Together, our community is making a difference</p>
  
  <div class="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
    <div>
      <div class="impact-counter-stat">$12,458</div>
      <p class="impact-counter-label">Total Donated</p>
    </div>
    
    <!-- Additional stats here -->
  </div>
</div>
```

### Documentation Elements

#### Note Box
```html
<div class="bg-docs-highlight border border-amber-200 rounded-lg p-4">
  <div class="flex items-start gap-4">
    <div class="bg-amber-100 text-amber-600 p-2 rounded-full shrink-0">
      <!-- Info icon -->
    </div>
    <div>
      <h3 class="text-amber-800 text-sm font-medium">Note Title</h3>
      <p class="text-amber-700 text-sm">Note content goes here.</p>
    </div>
  </div>
</div>
```

#### Code Block
```html
<div class="code-block">
  <pre><code>// Example code
function example() {
  console.log("Hello, Atrocitee!");
}</code></pre>
</div>
```

## Layout Guidelines

### Container
The main container width is set to 1200px with responsive padding:
```html
<div class="container mx-auto">
  <!-- Content goes here -->
</div>
```

### Responsive Breakpoints

| Breakpoint | Size | CSS Class Prefix |
|------------|------|------------------|
| Small | 640px | sm: |
| Medium | 768px | md: |
| Large | 1024px | lg: |
| Extra Large | 1200px | xl: |

### Content Layout
```html
<div class="content-layout">
  <aside class="content-sidebar">
    <!-- Sidebar navigation -->
  </aside>
  <main class="content-main">
    <!-- Main content -->
  </main>
</div>
```

## Accessibility Guidelines

- Maintain color contrast ratios of at least 4.5:1 for normal text and 3:1 for large text
- Ensure all interactive elements have visible focus states
- Provide text alternatives for all non-text content (images, icons, etc.)
- Use semantic HTML elements to convey meaning and structure
- Ensure forms are keyboard accessible and properly labeled
- Maintain a minimum touch target size of 44x44px for mobile interfaces
- Support both mouse and keyboard navigation

## Implementation Notes

This style guide represents the official design system for the Atrocitee MVP. The design focuses on clean, modern aesthetics with an emphasis on readability and brand consistency.

The implementation uses:
- Tailwind CSS for utility-based styling
- Varela Round as the primary font for a friendly, approachable appearance
- Component-based architecture
- Responsive design principles
- Semantic HTML for accessibility

All new components should adhere to this style guide to maintain consistency throughout the application.

### Tailwind Integration

Our design system is implemented using Tailwind CSS with custom components defined in `src/styles/design-system.css`. The core color palette, typography, spacing, and other design tokens are configured in `tailwind.config.js`.

#### Key Files:
- `tailwind.config.js` - Contains all design tokens as native Tailwind values
- `src/styles/design-system.css` - Defines component classes using Tailwind's @apply
- `src/styles/base.css` - Main CSS file that imports all styles in correct order

#### Example Component Definition:
```css
@layer components {
  .btn {
    @apply inline-flex items-center justify-center font-medium leading-normal 
           transition-all duration-300 ease-in-out rounded-md px-5 py-2 text-sm;
  }
  
  .btn-primary {
    @apply bg-primary text-white border border-primary 
           hover:bg-primary-dark hover:border-primary-dark hover:shadow-md;
  }
}
```

This approach gives us the flexibility of custom component classes while maintaining the utility-first workflow of Tailwind CSS. 