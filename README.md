# Medusa Plugin Brevo


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
