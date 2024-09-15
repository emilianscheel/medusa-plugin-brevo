# Medusa Plugin Brevo

This plugin is under development and is not yet ready for production use.

1. Create an account at [Brevo](https://www.brevo.co/)
2. Create a new template and get the template id

### 1. Install

```bash
npm install medusa-plugin-brevo
```


### 2. Configuration

Add the following to your `medusa-config.js`:

```js
module.exports = {
  //...
  plugins: [
    {
      resolve: 'medusa-plugin-brevo',
      options: {
        api_key: process.env.BREVO_API_KEY,
        from: {
            name: "Sender Name",
            email: "info@example.com"
        },
        template_map: {
            "order.placed": 21
        }
      }
    }
  ]
}

{
    resolve: `medusa-plugin-brevo`,
    /** @type {import('medusa-plugin-brevo').BrevoServiceOptions} */
    options: {
        api_key: process.env.BREVO_API_KEY,
        from: {
            name: "La Place Store",
            email: "info@la-place.store",
        },
        events: [
            {
                event: "user.created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "user.updated",
                template_id: 21,
                email: "auto",
            },
            {
                event: "customer.created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "customer.updated",
                template_id: 21,
                email: "auto",
            },
            {
                event: "customer.password_reset",
                template_id: 21,
                email: "auto",
            },
            {
                event: "invite.created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "estock-notification.restocked",
                template_id: 21,
                email: "auto",
            },
            {
                event: "user.created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.placed",
                template_id: 21,
                email: "auto",
                copy_to: "test7@la-place.site",
            },
            {
                event: "order.updated",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.canceled",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.completed",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.orders_claimed",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.refund_created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.payment_captured",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.payment_capture_failed",
                template_id: 21,
                email: "auto",
            },
            {
                event: "claim.shipment_created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "swap.created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "swap.received",
                template_id: 21,
                email: "auto",
            },
            {
                event: "swap.shipment_created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.fulfillment_created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "order.fulfillment_canceled",
                template_id: 21,
                email: "auto",
            },
            {
                event: "swap.shipment_created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "gift_card.created",
                template_id: 21,
                email: "auto",
            },
            {
                event: "gift_card.created",
                template_id: 21,
                email: "auto",
            },
        ],
    },
},
```

### 3. Test

Place an order.






## Event E-Mail Parameters

### `order.placed`

```typescript
type Parameters = {
    email: string
    order: {
        shipping_total
        discount_total
        tax_total
        refunded_total
        gift_card_total
        subtotal
        total
        customer_id
        customer

    },
    locale: string,
    has_discounts: boolean,
    has_gift_cards: boolean,
    date: string,
    items: {
        title: string
        description: string
        quantity: number
        product_id: string
        variant_id: string
        unit_price: number
        totals: LineItemTotals
        thumbnail: string
        discounted_price: string // Human readable
        price: string // Human readable
    }[]
}
```
