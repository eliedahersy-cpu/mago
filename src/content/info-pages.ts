// Copy for the simple footer pages. It states only facts confirmed in the spec
// (cash on delivery, $3 delivery, free over $30, 30 g protein, 100 g pasta,
// ready in 3–4 minutes, Mix Box, 10% off 5+ cups). Anything the business has
// not confirmed is phrased without numbers or promises and is listed in
// docs/content-to-confirm.md.

export type InfoSlug =
  | 'faq'
  | 'shipping'
  | 'returns'
  | 'terms'
  | 'privacy'
  | 'contact'
  | 'ingredients'
  | 'sustainability';

export interface InfoPage {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

export const infoPages: Record<InfoSlug, InfoPage> = {
  faq: {
    title: 'Frequently asked questions',
    intro: 'Everything you need to know about MAGO cups, ordering and delivery.',
    sections: [
      {
        heading: 'What is a MAGO cup?',
        body: 'A MAGO cup is a pasta meal inspired by Mediterranean flavours that is ready in minutes. Every cup has 100 g of pasta and 30 g of protein per serving.',
      },
      {
        heading: 'How do I prepare it?',
        body: 'Add hot water up to the fill line, stir in the sauce sachet, wait 3–4 minutes, then mix and enjoy.',
      },
      {
        heading: 'How do I pay?',
        body: 'We currently accept cash on delivery: you pay when your order arrives.',
      },
      {
        heading: 'How much is delivery?',
        body: 'Delivery is $3.00 per order, and free when your order comes to $30 or more.',
      },
      {
        heading: 'Can I mix flavours?',
        body: 'Yes. Build a MAGO Mix Box with any 5 cups. When your cart has 5 or more cups, you save 10% on them automatically.',
      },
      {
        heading: 'Where can I find allergen information?',
        body: 'Ingredients and allergen information are printed on every cup. If you have a specific question, please get in touch with us.',
      },
    ],
  },
  shipping: {
    title: 'Shipping & delivery',
    intro: 'We deliver MAGO cups across Lebanon.',
    sections: [
      {
        heading: 'Delivery fee',
        body: 'Delivery costs $3.00 per order. It is free when your order comes to $30 or more after discounts.',
      },
      {
        heading: 'Delivery time',
        body: 'After you place your order, our team will call you to confirm it and agree a delivery time.',
      },
      {
        heading: 'Payment',
        body: 'Pay in cash when your order arrives. Please have the exact amount ready if you can.',
      },
    ],
  },
  returns: {
    title: 'Returns',
    intro: 'We want every cup to arrive just right.',
    sections: [
      {
        heading: 'Something wrong with your order?',
        body: 'If an item arrives damaged or is not what you ordered, contact us and our team will look into it with you.',
      },
      {
        heading: 'How we handle requests',
        body: 'Because our cups are food products, our team reviews every request individually.',
      },
    ],
  },
  terms: {
    title: 'Terms & conditions',
    intro: 'These terms explain how ordering from MAGO works.',
    sections: [
      {
        heading: 'Orders',
        body: 'When you place an order, our team will contact you to confirm it. An order is accepted once it is confirmed.',
      },
      {
        heading: 'Prices',
        body: 'Prices are shown in US dollars. The total shown at checkout, including delivery and any discounts, is the amount you pay.',
      },
      {
        heading: 'Payment',
        body: 'Orders are paid in cash on delivery.',
      },
      {
        heading: 'Changes to these terms',
        body: 'We may update these terms from time to time. The version on this page applies to new orders.',
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'How we look after the information you share with us.',
    sections: [
      {
        heading: 'What we collect',
        body: 'When you order, we collect your name, email, phone number and delivery address. When you join our newsletter, we collect your email address.',
      },
      {
        heading: 'How we use it',
        body: 'We use your details to process and deliver your orders, to contact you about them, and, if you subscribed, to send you recipes and offers.',
      },
      {
        heading: 'Sharing',
        body: 'We do not sell your personal information. We only share it where needed to deliver your order.',
      },
      {
        heading: 'Your choices',
        body: 'You can unsubscribe from our emails at any time, and you can contact us to ask about the information we hold about you.',
      },
    ],
  },
  contact: {
    title: 'Contact us',
    intro: 'Questions about an order, a flavour, or stocking MAGO in your store? We would love to hear from you.',
    sections: [],
  },
  ingredients: {
    title: 'Our ingredients',
    intro: 'Real ingredients, Mediterranean flavours and plenty of protein.',
    sections: [
      {
        heading: 'The pasta',
        body: 'Every cup holds 100 g of pasta, from twirly fusilli to silky tagliolini, little shells and Lebanese rishta.',
      },
      {
        heading: 'The protein',
        body: 'Each cup gives you 30 g of protein per serving, so it works as a proper meal.',
      },
      {
        heading: 'The sauces',
        body: 'Every flavour comes with its own sauce sachet, from smoky muhammara and basil pesto to white truffle and tahini tarator.',
      },
    ],
  },
  sustainability: {
    title: 'Sustainability',
    intro: 'Good food, a brighter tomorrow. We believe in nourishing people and the planet.',
    sections: [
      {
        heading: 'Our commitments',
        body: 'We are working towards recyclable packaging, responsibly sourced ingredients and support for local farmers.',
      },
    ],
  },
};
