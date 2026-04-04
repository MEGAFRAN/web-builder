const registry = {
  sections: {
    Hero: {
      path: "components/sections/Hero.tsx",
      useCases: [
        "Main landing page introduction",
        "Top-of-page attention-grabbing section with a headline and call-to-action",
        "First thing visitors see — drives them toward a primary action",
      ],
    },
    CTA: {
      path: "components/sections/CTA.tsx",
      useCases: [
        "Mid-page or bottom-of-page conversion push",
        "Encouraging users to sign up, buy, or take a specific action",
        "Promotional banners between content sections",
      ],
    },
    FeatureGrid: {
      path: "components/sections/FeatureGrid.tsx",
      useCases: [
        "Showcasing product features or service highlights",
        "Listing benefits in a scannable grid",
        "Explaining what a product does across multiple dimensions",
      ],
    },
    StatsBar: {
      path: "components/sections/StatsBar.tsx",
      useCases: [
        "Displaying key metrics or achievements (e.g. '10M users', '99% uptime')",
        "Building credibility with numbers",
        "Social proof through quantitative data",
      ],
    },
    LogoCloud: {
      path: "components/sections/LogoCloud.tsx",
      useCases: [
        "'Trusted by' or 'As seen in' sections",
        "Showcasing partner or customer logos",
        "Building brand credibility through association",
      ],
    },
    Testimonials: {
      path: "components/sections/Testimonials.tsx",
      useCases: [
        "Displaying customer quotes and reviews",
        "Social proof from real users",
        "Building trust before a conversion section",
      ],
    },
    PricingTable: {
      path: "components/sections/PricingTable.tsx",
      useCases: [
        "Showing pricing tiers side by side",
        "Comparing plan features across tiers",
        "Driving users to select a plan",
      ],
    },
    FAQ: {
      path: "components/sections/FAQ.tsx",
      useCases: [
        "Answering common questions before users reach out",
        "Reducing support load with self-serve answers",
        "Addressing objections near a pricing or CTA section",
      ],
    },
  },

  layout: {
    Container: {
      path: "components/layout/Container.tsx",
      useCases: [
        "Constraining content width and centering it on wide screens",
        "Wrapping any section's inner content for consistent horizontal spacing",
      ],
    },
    Section: {
      path: "components/layout/Section.tsx",
      useCases: [
        "Full-width page section wrapper with background color and vertical padding",
        "Visually separating page regions with alternating backgrounds",
      ],
    },
    Grid: {
      path: "components/layout/Grid.tsx",
      useCases: [
        "Arranging items in a multi-column responsive grid",
        "Laying out cards, features, or any repeated content in columns",
      ],
    },
    Stack: {
      path: "components/layout/Stack.tsx",
      useCases: [
        "Vertically stacking components with consistent spacing",
        "Building form layouts or content blocks with even gaps",
      ],
    },
    Divider: {
      path: "components/layout/Divider.tsx",
      useCases: [
        "Visually separating two content areas with a horizontal line",
        "Adding subtle structure inside cards or sections",
      ],
    },
  },

  navigation: {
    Navbar: {
      path: "components/navigation/Navbar.tsx",
      useCases: [
        "Top-level site navigation with logo and links",
        "Standard page header present on every page",
      ],
    },
    NavLink: {
      path: "components/navigation/NavLink.tsx",
      useCases: [
        "Individual link inside a navigation menu",
        "Link that highlights when the current page matches",
      ],
    },
    Footer: {
      path: "components/navigation/Footer.tsx",
      useCases: [
        "Bottom-of-page footer with grouped links and copyright",
        "Site-wide secondary navigation",
      ],
    },
    Breadcrumb: {
      path: "components/navigation/Breadcrumb.tsx",
      useCases: [
        "Showing the user's location within a nested page hierarchy",
        "Helping users navigate back to parent pages",
      ],
    },
  },

  content: {
    Heading: {
      path: "components/content/Heading.tsx",
      useCases: [
        "Page or section titles (h1–h4)",
        "Any time a semantic heading is needed with controlled size and color",
      ],
    },
    Text: {
      path: "components/content/Text.tsx",
      useCases: [
        "Body copy, descriptions, and supporting text",
        "Any paragraph-level text that needs size, weight, or color control",
      ],
    },
    Image: {
      path: "components/content/Image.tsx",
      useCases: [
        "Displaying a responsive image with optional rounding",
        "Product screenshots, illustrations, or photos within content",
      ],
    },
    Avatar: {
      path: "components/content/Avatar.tsx",
      useCases: [
        "User profile pictures in comments, testimonials, or team sections",
        "Fallback initials when no image is available",
      ],
    },
    Badge: {
      path: "components/content/Badge.tsx",
      useCases: [
        "Status labels (e.g. 'New', 'Beta', 'Sold out')",
        "Category tags on blog posts or product listings",
        "Indicating success, warning, or error states inline",
      ],
    },
    Alert: {
      path: "components/content/Alert.tsx",
      useCases: [
        "Displaying system messages like success confirmations or errors",
        "Warning users about destructive actions or important notices",
        "Feedback after form submissions",
      ],
    },
  },

  data: {
    Card: {
      path: "components/data/Card.tsx",
      useCases: [
        "Grouping related content in a visually distinct container",
        "Blog post previews, product listings, team member profiles",
        "Any content block that benefits from a bordered or padded box",
      ],
    },
    List: {
      path: "components/data/List.tsx",
      useCases: [
        "Bulleted or numbered content like feature lists or steps",
        "Simple enumeration where a table would be overkill",
      ],
    },
    Table: {
      path: "components/data/Table.tsx",
      useCases: [
        "Structured data with rows and labeled columns",
        "Comparison tables, data exports, or report-style content",
      ],
    },
  },

  inputs: {
    Button: {
      path: "components/inputs/Button.tsx",
      useCases: [
        "Any clickable action: submit, navigate, trigger an event",
        "Primary actions (e.g. 'Get started'), secondary actions, and destructive actions (e.g. 'Delete')",
      ],
    },
    Input: {
      path: "components/inputs/Input.tsx",
      useCases: [
        "Single-line text entry in forms (name, email, search, etc.)",
      ],
    },
    Textarea: {
      path: "components/inputs/Textarea.tsx",
      useCases: [
        "Multi-line text entry for messages, descriptions, or notes",
      ],
    },
    Select: {
      path: "components/inputs/Select.tsx",
      useCases: [
        "Choosing one option from a predefined list",
        "Dropdowns for country, category, or plan selection",
      ],
    },
    Checkbox: {
      path: "components/inputs/Checkbox.tsx",
      useCases: [
        "Toggling a boolean option in a form (agree to terms, enable feature)",
      ],
    },
    ContactForm: {
      path: "components/inputs/ContactForm.tsx",
      useCases: [
        "Ready-to-use contact or inquiry form with name, email, and message",
        "Use instead of composing Input + Textarea manually when a standard contact form is needed",
      ],
    },
  },
} as const;

export default registry;
