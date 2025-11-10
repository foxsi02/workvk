# Design Guidelines for USLUGI.ru Service Marketplace

## Design Approach
**Modern Professional**: Clean, trust-building design with contemporary color palette. Focus on accessibility, clarity, and seamless user experience.

## Brand Identity

### Logo
- **New Logo**: Professional services marketplace logo featuring abstract handshake and tool icon
- **Colors**: Cyan-blue gradient with orange accent
- **Usage**: Header (40px height desktop, 32px mobile), loading states, watermarks

### Color Palette

**Primary Colors:**
- **Primary Cyan**: `hsl(199, 89%, 48%)` - Modern professional blue for primary CTAs, links, and brand elements
  - Light mode: Vibrant cyan for buttons and interactive elements
  - Dark mode: Maintains vibrancy with high saturation
- **Secondary Orange**: `hsl(25, 95%, 53%)` - Energetic orange for secondary actions and accents
  - Provides visual contrast and energy
  - Used for badges, highlights, and special features

**Neutral Colors:**
- **Background Light**: `hsl(210, 20%, 98%)` - Soft blue-tinted white
- **Background Dark**: `hsl(222, 47%, 7%)` - Deep navy-blue tinted dark
- **Foreground Light**: `hsl(222, 47%, 11%)` - Dark blue-gray for text
- **Foreground Dark**: `hsl(210, 20%, 98%)` - Light text for dark mode
- **Card**: Pure white in light mode, `hsl(222, 47%, 9%)` in dark mode

**Semantic Colors:**
- **Success Green**: `hsl(142, 76%, 36%)` - Confirmed bookings, success states
- **Destructive Red**: `hsl(0, 84%, 60%)` - Errors, warnings, cancellations
- **Muted**: Subtle backgrounds for less important content

## Typography System

**Font Stack**:
- Primary: Inter or Manrope via Google Fonts (clean, modern, excellent Cyrillic support)
- Headings: 700 weight
- Body: 400 regular, 500 medium for emphasis
- UI elements: 600 semibold

**Scale**:
- Hero: text-4xl to text-6xl (36-60px)
- Section headers: text-2xl to text-3xl (24-30px)
- Card titles: text-lg to text-xl (18-20px)
- Body: text-base (16px)
- Captions: text-sm (14px)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section spacing: py-12 (mobile), py-16 to py-24 (desktop)
- Card gaps: gap-4 to gap-6
- Generous whitespace around CTAs: my-8

**Grid Strategy**:
- Master cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Service categories: grid-cols-2 md:grid-cols-3 lg:grid-cols-6
- Testimonials/reviews: grid-cols-1 md:grid-cols-2
- Mobile: Always single column for readability

## Core Components

**Navigation Header**:
- Sticky positioning with subtle shadow on scroll
- Logo left, main nav center, user/CTA right
- Mobile: Hamburger menu with slide-out drawer
- Search bar prominently placed (for finding masters/services)
- Category dropdown with icons

**Master Cards**:
- Image-first design with overlay gradient for text readability
- Avatar with verification badge overlay
- Rating stars + review count prominently displayed
- Service category tags
- Price range indicator
- "View Profile" CTA button (primary cyan color)
- Hover: Subtle lift (shadow-lg) + scale transform

**Hero Section** (Homepage):
- Full-width background: Photography of happy client with professional master at work
- Centered search interface with city autocomplete + category selector
- Headline: "Найдите проверенных мастеров в вашем городе" (48px bold)
- Subheadline: Brief value proposition
- Trust indicators below search: "10,000+ мастеров" "5,000+ отзывов" "Безопасные платежи"

**Buttons**:
- Primary: Cyan background (`bg-primary`), white text, rounded corners
- Secondary: Orange background (`bg-secondary`), white text
- Ghost/Outline: Border with transparent background, hover elevation
- Sizes: default (h-12), sm (h-10), lg (h-14)

**Cards**:
- Pure white background in light mode
- Subtle elevation with minimal shadows
- Rounded corners (`rounded-md`)
- Border for definition when needed
- Padding: p-6 standard

**Map Integration**:
- Split layout: Filters sidebar (30%) | Map view (70%)
- Master markers with category icons and rating badges
- Info popup on marker click with mini master card
- "List view" toggle for mobile optimization
- Cluster markers for dense areas

**Profile Pages** (Master Detail):
- Hero: Cover photo + profile avatar (overlapping design)
- Verification badges and achievement icons prominently displayed
- Tabs: "Услуги и цены" | "Портфолио" | "Отзывы" | "О мастере"
- Portfolio: Masonry grid (2-3 columns) with lightbox
- CTA sticky footer on mobile: "Заказать услугу" button (primary cyan)

**Order/Booking Flow**:
- Multi-step form with progress indicator
- Service selection with visual cards
- Date/time picker with calendar UI
- Address input with map preview
- Payment method selection (ЮKassa integration)
- Order summary sidebar (sticky on desktop)

**Chat Interface**:
- WhatsApp-inspired message bubbles
- Client messages: right-aligned, primary cyan background
- Master messages: left-aligned, light gray background
- Typing indicators and read receipts
- Image/file attachment support
- Integrated within order detail page

**Achievement System**:
- Badge showcase on profile with tooltips
- Progress bars for next achievement tier
- Celebration modal on earning new badge
- Gamification: "75% к следующему уровню"
- Badges use secondary orange color for emphasis

**Articles/Blog**:
- Featured article: Large card with image (2/3 width)
- Article grid: Image thumbnail + title + excerpt + category tag
- Category filters as pill buttons
- Author avatars with byline
- Reading time estimates

**Admin Dashboard**:
- Sidebar navigation with icons
- Stats cards at top: Total users, Active orders, Revenue, New reviews
- Data tables with sorting/filtering
- Action buttons (Approve, Reject, Edit) with confirmation modals
- Charts for analytics (using Recharts)

## Dark Mode

**Implementation**:
- Toggle in header/user menu
- Smooth transitions between modes
- Dark mode uses deep navy backgrounds with cyan/orange accents
- Maintains readability with proper contrast ratios
- All interactive elements adapt with proper hover states

## Accessibility

**Color Contrast**:
- Primary text: WCAG AA compliant (4.5:1 minimum)
- Interactive elements: Clearly distinguishable
- Focus indicators: Visible ring on keyboard navigation

**Keyboard Navigation**:
- All interactive elements accessible via Tab
- Modal dialogs trap focus
- Skip links for main content

## UI Patterns

**Trust Indicators**:
- Verification badges (checkmark icon in cyan)
- Star ratings with review counts
- Portfolio images with counts
- Achievement badges
- Secure payment icons (lock symbol)

**Loading States**:
- Skeleton screens for content loading
- Spinner for actions (cyan color)
- Progress bars for multi-step processes
- Optimistic UI updates where appropriate

**Empty States**:
- Friendly illustrations
- Clear messaging
- Suggested actions (in primary cyan buttons)

## Responsive Design

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile-First Approach**:
- Stack layouts vertically on mobile
- Hamburger menu navigation
- Touch-friendly tap targets (min 44x44px)
- Sticky CTAs at bottom for easy access
- Simplified forms with fewer fields per screen

**Desktop Enhancements**:
- Multi-column layouts
- Hover states and tooltips
- Sidebar navigation
- Richer data tables and filters
- Larger images and media

## Performance

**Images**:
- Lazy loading for below-fold content
- Responsive images with srcset
- WebP format with fallbacks
- Compressed assets
- Placeholder blur effects

**Optimization**:
- Code splitting by route
- Minimal CSS/JS bundle sizes
- Caching strategies for static assets
- Progressive enhancement approach

## Russian Localization

**Language Considerations**:
- Cyrillic-friendly fonts (Inter, Manrope)
- Proper noun declensions in UI copy
- Currency: Russian rubles (₽)
- Date format: DD.MM.YYYY
- Phone format: +7 (XXX) XXX-XX-XX
- Address format: Russian postal standards

**Cultural Adaptation**:
- Trust-building elements prominent (verification, reviews)
- Payment method: ЮKassa (preferred in Russia)
- Map integration: Yandex Maps (familiar to Russian users)
- Formal/informal balance in copy ("Вы" vs "ты")

## Legal Compliance

**GDPR/ФЗ-152 Compliance**:
- Cookie consent banner
- Privacy policy link in footer
- Data processing agreements
- User data export/deletion options
- Clear consent checkboxes

**Platform Disclaimers**:
- User agreement link
- Service provider independence notice
- Payment processing terms
- Dispute resolution process

## Implementation Notes

**Technology Stack**:
- Tailwind CSS for styling (using design tokens)
- Shadcn/ui components (customized with new color scheme)
- Radix UI primitives for accessibility
- Lucide React icons
- React Hook Form for forms
- TanStack Query for data fetching

**CSS Custom Properties**:
All colors defined in `index.css` as CSS variables following the new cyan/orange color scheme. Use semantic tokens (`--primary`, `--secondary`, etc.) rather than hardcoded hex values.

**Component Variants**:
Buttons, badges, and cards automatically adapt to light/dark mode using CSS variables. No manual dark mode classes needed on individual components.
