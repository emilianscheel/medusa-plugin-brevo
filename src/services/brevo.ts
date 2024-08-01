import {
    SendSmtpEmail,
    TransactionalEmailsApi,
    TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";
import {
    AbstractNotificationService,
    CartService,
    ClaimService,
    Discount,
    FulfillmentProviderService,
    GiftCardService,
    LineItem,
    LineItemService,
    Logger,
    OrderService,
    ProductVariantService,
    ReturnService,
    StoreService,
    SwapService,
    TotalsService,
    UserService,
    Order,
    ReturnItem,
} from "@medusajs/medusa";
import { humanizeAmount, zeroDecimalCurrencies } from "medusa-core-utils";
import { BrevoServiceOptions, SendOptions } from "./types";
import { FulfillmentService } from "@medusajs/medusa/dist/services";

export default class BrevoNotificationService extends AbstractNotificationService {
    static identifier = "brevo";
    protected config_: BrevoServiceOptions;
    protected brevo_: TransactionalEmailsApi;
    protected logger_: Logger;

    /* Medusa.js Services */
    protected fulfillmentProviderService_: FulfillmentProviderService;
    protected orderService_: OrderService;
    protected storeService_: StoreService;
    protected lineItemService_: LineItemService;
    protected cartService_: CartService;
    protected claimService_: ClaimService;
    protected returnService_: ReturnService;
    protected swapService_: SwapService;
    protected fulfillmentService_: FulfillmentService;
    protected totalsService_: TotalsService;
    protected productVariantService_: ProductVariantService;
    protected giftCardService_: GiftCardService;
    protected userService_: UserService;

    constructor(
        container: {
            fulfillmentProviderService: FulfillmentProviderService;
            storeService: StoreService;
            lineItemService: LineItemService;
            orderService: OrderService;
            cartService: CartService;
            claimService: ClaimService;
            returnService: ReturnService;
            swapService: SwapService;
            fulfillmentService: FulfillmentService;
            totalsService: TotalsService;
            productVariantService: ProductVariantService;
            giftCardService: GiftCardService;
            userService: UserService;
            logger: Logger;
        },
        options: BrevoServiceOptions,
    ) {
        super(container);

        this.fulfillmentProviderService_ = container.fulfillmentProviderService;
        this.storeService_ = container.storeService;
        this.lineItemService_ = container.lineItemService;
        this.orderService_ = container.orderService;
        this.cartService_ = container.cartService;
        this.claimService_ = container.claimService;
        this.returnService_ = container.returnService;
        this.swapService_ = container.swapService;
        this.fulfillmentService_ = container.fulfillmentService;
        this.totalsService_ = container.totalsService;
        this.productVariantService_ = container.productVariantService;
        this.giftCardService_ = container.giftCardService;
        this.userService_ = container.userService;

        this.config_ = options;
        this.logger_ = container.logger;

        this.brevo_ = new TransactionalEmailsApi();

        this.brevo_.setApiKey(
            TransactionalEmailsApiApiKeys.apiKey,
            this.config_.api_key,
        );
    }

    async sendEmail(options: SendOptions) {
        let smtpEmail = new SendSmtpEmail();
        smtpEmail.templateId = options.templateId;

        smtpEmail.sender = {
            name: options.from_name,
            email: options.from_email,
        };

        smtpEmail.to = [
            {
                email: options.to_email,
            },
        ];

        if (this.config_.copy_to !== undefined) {
            smtpEmail.to.push({
                email: this.config_.copy_to,
            });
        }

        smtpEmail.params = {
            ...options.data,
            raw: JSON.stringify(options.data),
        } as { [key: string]: any } | undefined;

        await this.brevo_.sendTransacEmail(smtpEmail);
    }

    async sendNotification(
        event: string,
        data: any,
        attachmentGenerator: unknown,
    ): Promise<{
        to: string;
        status: string;
        data: Record<string, unknown>;
    }> {
        const eventConfig = this.config_.events.find(
            (item) => item.event === event,
        );

        if (!eventConfig) {
            this.logger_.log(
                `Brevo Template Event not found. Please add '${event}' to 'events' options of 'medusa-plugin-brevo'.`,
            );

            return {
                to: this.config_.copy_to ?? this.config_.from.email,
                status: "failed",
                data: {},
            };
        }

        const populatedData = await this.populateData(
            event,
            data,
            attachmentGenerator,
        );

        const sendOptions = {
            templateId: eventConfig.templateId,
            data: populatedData,
            from_email: this.config_.from.email,
            from_name: this.config_.from.name,
            admin_email: this.config_.copy_to ?? this.config_.from.email,
            to_email:
                populatedData.email ??
                this.config_.copy_to ??
                this.config_.from.email,
        };

        this.sendEmail(sendOptions);

        this.logger_.log(
            `Brevo Notification sent ${sendOptions.to_email}`,
            sendOptions,
        );

        return {
            to: sendOptions.to_email,
            status: "done",
            data: sendOptions,
        };
    }

    async resendNotification(
        notification: any,
        config: any,
        attachmentGenerator: unknown,
    ): Promise<{
        to: string;
        status: string;
        data: Record<string, unknown>;
    }> {
        const sendOptions = {
            ...notification.data,
            to_email: config.to || notification.to,
        } as SendOptions;

        this.sendEmail(sendOptions);

        this.logger_.log(
            `Brevo Notification resent ${sendOptions.to_email}`,
            sendOptions,
        );

        return {
            to: sendOptions.to_email,
            status: "done",
            data: sendOptions,
        };
    }

    /**
     * ## `fetchData`
     * Fetches useful data for the given event
     */

    async populateData(
        event: string,
        data: unknown,
        attachementGenerator: unknown,
    ) {
        switch (event) {
            /* User */
            case "user.created":
                return data;
            case "user.updated":
                return data;

            /* Customer */
            case "customer.created":
                return this.customerData(data);
            case "customer.updated":
                return this.customerData(data);
            case "customer.password_reset":
                return data;
            case "invite.created":
                return this.inviteCreatedData(data);

            /* Product Restock */
            case "restock-notification.restocked":
                return this.restockNotificationData(
                    data as { emails: string[]; variant_id: string },
                );

            /* Order */
            case "order.placed":
                return this.orderData(data as { id: string });
            case "order.updated":
                return this.orderData(data as { id: string });
            case "order.canceled":
                return this.orderData(data as { id: string });
            case "order.completed":
                return this.orderData(data as { id: string });
            case "order.orders_claimed":
                return this.orderData(data as { id: string });
            case "order.refund_created":
                return this.orderRefundCreatedData(
                    data as { id: string; refund_id: string },
                );

            /* Order Payment */
            case "order.payment_captured":
                return this.orderData(data as { id: string });
            case "order.payment_capture_failed":
                return this.orderData(data as { id: string });

            /* Order Claim */
            case "claim.shipment_created":
                return this.claimShipmentCreatedData(
                    data as { id: string; fulfillment_id: string },
                );

            /* Order Swap */
            case "swap.created":
                return this.swapData(data as { id: string });
            case "swap.shipment_created":
                return this.swapShipmentCreatedData(
                    data as { id: string; fulfillment_id: string },
                );
            case "swap.received":
                return this.swapData(data as { id: string });

            /* Order Fulfillment */
            case "order.fulfillment_created":
                return this.orderData(data as { id: string });
            case "order.fulfillment_canceled":
                return this.orderData(data as { id: string });

            /* Order Shipment */
            case "order.shipment_created":
                return this.orderShipmentCreatedData(
                    data as { id: string; fulfillment_id: string },
                );

            /* Gift Card */
            case "order.gift_card_created":
                return this.giftCardCreatedData(data as { id: string });
            case "gift_card.created":
                return this.giftCardCreatedData(data as { id: string });

            // See https://docs.medusajs.com/development/events/events-list
            // for a list of all events
            default:
                return data;
        }
    }

    /**
     * ## `humanPrice_`
     * Formats the price to a human readable format
     */

    humanPrice_(amount: number, currency: string) {
        if (!amount) {
            return "0.00";
        }

        const normalized = humanizeAmount(amount, currency);
        return normalized.toFixed(
            zeroDecimalCurrencies.includes(currency.toLowerCase()) ? 0 : 2,
        );
    }

    /**
     * ## `normalizeThumbUrl_`
     * Makes sure the thumb url is a full url
     */

    normalizeThumbUrl_(url: string) {
        if (url.startsWith("http")) return url;

        if (url.startsWith("//")) return `https: ${url}`;

        return url;
    }

    /**
     * ## `extractLocale`
     * Extracts the locale from the order's cart
     */

    async extractLocale(fromOrder: Order) {
        if (fromOrder.cart_id) {
            try {
                const cart = await this.cartService_.retrieve(
                    fromOrder.cart_id,
                    {
                        select: ["id", "context"],
                    },
                );

                if (cart.context && cart.context.locale) {
                    return cart.context.locale;
                }
            } catch (err) {
                console.log(err);
                console.warn("Failed to gather context for order");
                return null;
            }
        }
        return null;
    }

    /**
     * ## `orderPlacedData`
     * Populates the data for the `order.placed` event
     */

    async orderData({ id }: { id: string }) {
        const order = await this.orderService_.retrieve(id, {
            select: [
                "shipping_total",
                "discount_total",
                "tax_total",
                "refunded_total",
                "gift_card_total",
                "subtotal",
                "total",
                "customer_id",
                "customer",
            ],
            relations: [
                "customer",
                "billing_address",
                "shipping_address",
                "discounts",
                "discounts.rule",
                "shipping_methods",
                "shipping_methods.shipping_option",
                "payments",
                "fulfillments",
                "returns",
                "gift_cards",
                "gift_card_transactions",
            ],
        });

        const currencyCode = order.currency_code.toUpperCase();

        type PopulatedLineItem = LineItem & {
            totals: any;
            thumbnail: string | null;
            discounted_price: string; // Human readable
            price: string; // Human readable
        };

        let populatedItems: PopulatedLineItem[] = [];

        for (const item of order.items) {
            const totals = await this.totalsService_.getLineItemTotals(
                item,
                order,
                {
                    include_tax: true,
                    use_tax_lines: true,
                },
            );

            const populatedItem = {
                ...item,
                totals: totals,
                thumbnail: this.normalizeThumbUrl_(item.thumbnail ?? ""),
                discounted_price: `${this.humanPrice_(totals.total / item.quantity, currencyCode)} ${currencyCode}`,
                price: `${this.humanPrice_(totals.original_total / item.quantity, currencyCode)} ${currencyCode}`,
            } as PopulatedLineItem;

            populatedItems.push(populatedItem);
        }

        type PopulatedDiscount = Discount & {
            is_giftcard: boolean;
            code: string;
            descriptor: string;
        };

        let discounts: PopulatedDiscount[] = [];

        if (order.discounts) {
            for (const discount of order.discounts) {
                const populatedDiscount = {
                    ...discount,
                    is_giftcard: false,
                    code: discount.code,
                    descriptor: `${discount.rule.value}${discount.rule.type === "percentage" ? "%" : ` ${currencyCode}`}`,
                } as PopulatedDiscount;

                discounts.push(populatedDiscount);
            }
        }

        let giftCards: PopulatedDiscount[] = [];
        if (order.gift_cards) {
            for (const giftCard of order.gift_cards) {
                const populatedGiftCard = {
                    is_giftcard: true,
                    code: giftCard.code,
                    descriptor: `${giftCard.value} ${currencyCode}`,
                } as PopulatedDiscount;

                giftCards.push(populatedGiftCard);
            }
        }

        const locale = await this.extractLocale(order);

        // Includes taxes in discount amount
        const discountTotal = populatedItems.reduce((acc, item) => {
            return acc + item.totals.original_total - item.totals.total;
        }, 0);

        const discounted_subtotal = populatedItems.reduce((acc, item) => {
            return acc + item.totals.total;
        }, 0);
        const subtotal = populatedItems.reduce((acc, item) => {
            return acc + item.totals.original_total;
        }, 0);

        const subtotal_ex_tax = populatedItems.reduce((total, item) => {
            return total + item.totals.subtotal;
        }, 0);

        return {
            email: order.email,
            order: order,
            locale: locale,
            has_discounts: order.discounts.length,
            has_gift_cards: order.gift_cards.length,
            date: order.created_at.toDateString(),
            items: populatedItems,
            discounts: [...discounts, ...giftCards],
            subtotal_ex_tax: `${this.humanPrice_(
                subtotal_ex_tax,
                currencyCode,
            )} ${currencyCode}`,
            subtotal: `${this.humanPrice_(subtotal, currencyCode)} ${currencyCode}`,
            gift_card_total: `${this.humanPrice_(
                order.gift_card_total,
                currencyCode,
            )} ${currencyCode}`,
            tax_total: `${this.humanPrice_(order.tax_total ?? 0, currencyCode)} ${currencyCode}`,
            discount_total: `${this.humanPrice_(
                discountTotal,
                currencyCode,
            )} ${currencyCode}`,
            shipping_total: `${this.humanPrice_(
                order.shipping_total,
                currencyCode,
            )} ${currencyCode}`,
            total: `${this.humanPrice_(order.total, currencyCode)} ${currencyCode}`,
        };
    }

    /**
     * ## `giftCardCreatedData`
     * Populates the data for the `gift_card.created` event
     */

    async giftCardCreatedData({ id }) {
        const giftCard = await this.giftCardService_.retrieve(id, {
            relations: ["region", "order"],
        });
        const taxRate = giftCard.region.tax_rate / 100;
        const locale = giftCard.order
            ? await this.extractLocale(giftCard.order)
            : null;
        const email = giftCard.order
            ? giftCard.order.email
            : giftCard.metadata.email;

        return {
            email: email,
            ...giftCard,
            locale,
            display_value: `${this.humanPrice_(
                giftCard.value * 1 + taxRate,
                giftCard.region.currency_code,
            )} ${giftCard.region.currency_code}`,
            message:
                giftCard.metadata?.message ||
                giftCard.metadata?.personal_message,
        };
    }

    /**
     * ## `orderShipmentCreatedData`
     * Populates the data for the `order.shipment.created` event
     */

    async orderShipmentCreatedData({ id, fulfillment_id }) {
        const order = await this.orderService_.retrieve(id, {
            select: [
                "shipping_total",
                "discount_total",
                "tax_total",
                "refunded_total",
                "gift_card_total",
                "subtotal",
                "total",
                "refundable_amount",
            ],
            relations: [
                "customer",
                "billing_address",
                "shipping_address",
                "discounts",
                "discounts.rule",
                "shipping_methods",
                "shipping_methods.shipping_option",
                "payments",
                "fulfillments",
                "returns",
                "gift_cards",
                "gift_card_transactions",
            ],
        });

        const shipment = await this.fulfillmentService_.retrieve(
            fulfillment_id,
            {
                relations: ["items", "tracking_links"],
            },
        );

        const locale = await this.extractLocale(order);

        return {
            email: order.email,
            locale,
            order,
            date: shipment.shipped_at.toDateString(),
            fulfillment: shipment,
            tracking_links: shipment.tracking_links,
            tracking_number: shipment.tracking_numbers.join(", "),
        };
    }

    /**
     * ## `orderRefundCreatedData`
     * Populates the data for the `order.refund.created` event
     */

    async orderRefundCreatedData({ id, refund_id }) {
        const order = await this.orderService_.retrieveWithTotals(id, {
            relations: ["refunds", "items"],
        });

        const refund = order.refunds.find((refund) => refund.id === refund_id);

        return {
            email: order.email,
            order: order,
            refund: refund,
            refund_amount: `${this.humanPrice_(refund?.amount ?? 0, order.currency_code)} ${order.currency_code}`,
        };
    }

    /**
     * ## `customerData`
     * Populates the data for the `customer.created` event
     */

    customerData(data: any) {
        if (!data.has_account) return null;
        return data;
    }

    /**
     * ## `inviteCreatedData`
     * Populates the data for the `invite.created` event
     */

    inviteCreatedData(data: any) {
        return { ...data, email: data.user_email };
    }

    /**
     * ## `swapData`
     * Populates the data for the `swap.created` event
     */

    async swapData({ id }) {
        const store = await this.storeService_.retrieve();
        const swap = await this.swapService_.retrieve(id, {
            relations: [
                "additional_items.variant.product.profiles",
                "additional_items.tax_lines",
                "return_order",
                "return_order.items",
                "return_order.items.item",
                "return_order.shipping_method",
                "return_order.shipping_method.shipping_option",
            ],
        });

        const returnRequest = swap.return_order;

        const items = await this.lineItemService_.list(
            {
                id: returnRequest.items.map(({ item_id }) => item_id),
            },
            {
                relations: ["tax_lines", "variant.product.profiles"],
            },
        );

        returnRequest.items = returnRequest.items.map((item) => {
            const found = items.find((i) => i.id === item.item_id);
            return {
                ...item,
                item: found,
            };
        }) as ReturnItem[];

        const swapLink =
            store.swap_link_template?.replace(/\{cart_id\}/, swap.cart_id) ??
            "";

        const order = await this.orderService_.retrieve(swap.order_id, {
            select: ["total"],
            relations: [
                "items.variant.product.profiles",
                "items.tax_lines",
                "discounts",
                "discounts.rule",
                "shipping_address",
                "swaps",
                "swaps.additional_items",
                "swaps.additional_items.tax_lines",
                "swaps.additional_items.variant",
            ],
        });

        const cart = await this.cartService_.retrieve(swap.cart_id, {
            relations: ["items.variant.product.profiles"],
            select: [
                "total",
                "tax_total",
                "discount_total",
                "shipping_total",
                "subtotal",
            ],
        });
        const currencyCode = order.currency_code.toUpperCase();

        const decoratedItems = await Promise.all(
            cart.items.map(async (i) => {
                const totals = await this.totalsService_.getLineItemTotals(
                    i,
                    cart,
                    {
                        include_tax: true,
                    },
                );

                return {
                    ...i,
                    totals,
                    tax_lines: totals.tax_lines,
                    price: `${this.humanPrice_(
                        totals.original_total / i.quantity,
                        currencyCode,
                    )} ${currencyCode}`,
                    discounted_price: `${this.humanPrice_(
                        totals.total / i.quantity,
                        currencyCode,
                    )} ${currencyCode}`,
                };
            }),
        );

        const returnTotal = decoratedItems.reduce((acc, next) => {
            const { total } = next.totals;
            if (next.is_return && next.variant_id) {
                return acc + -1 * total;
            }
            return acc;
        }, 0);

        const additionalTotal = decoratedItems.reduce((acc, next) => {
            const { total } = next.totals;
            if (!next.is_return) {
                return acc + total;
            }
            return acc;
        }, 0);

        const refundAmount = swap.return_order.refund_amount;

        const locale = await this.extractLocale(order);

        return {
            locale,
            swap,
            order,
            return_request: returnRequest,
            date: swap.updated_at.toDateString(),
            swap_link: swapLink,
            email: order.email,
            items: decoratedItems.filter((di) => !di.is_return),
            return_items: decoratedItems.filter((di) => di.is_return),
            return_total: `${this.humanPrice_(
                returnTotal,
                currencyCode,
            )} ${currencyCode}`,
            refund_amount: `${this.humanPrice_(
                refundAmount,
                currencyCode,
            )} ${currencyCode}`,
            additional_total: `${this.humanPrice_(
                additionalTotal,
                currencyCode,
            )} ${currencyCode}`,
        };
    }

    /**
     * ## `swapShipmentCreatedData`
     * Populates the data for the `swap.shipment.created` event
     */

    async swapShipmentCreatedData({ id, fulfillment_id }) {
        const swap = await this.swapService_.retrieve(id, {
            relations: [
                "shipping_address",
                "shipping_methods",
                "shipping_methods.shipping_option",
                "shipping_methods.tax_lines",
                "additional_items.variant.product.profiles",
                "additional_items.tax_lines",
                "return_order",
                "return_order.items",
            ],
        });

        const order = await this.orderService_.retrieve(swap.order_id, {
            relations: [
                "region",
                "items",
                "items.tax_lines",
                "items.variant.product.profiles",
                "discounts",
                "discounts.rule",
                "swaps",
                "swaps.additional_items.variant.product.profiles",
                "swaps.additional_items.tax_lines",
            ],
        });

        const cart = await this.cartService_.retrieve(swap.cart_id, {
            select: [
                "total",
                "tax_total",
                "discount_total",
                "shipping_total",
                "subtotal",
            ],
            relations: ["items.variant.product.profiles"],
        });

        const returnRequest = swap.return_order;
        const items = await this.lineItemService_.list(
            {
                id: returnRequest.items.map(({ item_id }) => item_id),
            },
            {
                relations: ["tax_lines", "variant.product.profiles"],
            },
        );

        const taxRate = (order.tax_rate ?? 0) / 100;
        const currencyCode = order.currency_code.toUpperCase();

        const returnItems = (await Promise.all(
            swap.return_order.items.map(async (i: any) => {
                const found = items.find((oi) => oi.id === i.item_id);
                const totals = await this.totalsService_.getLineItemTotals(
                    i,
                    cart,
                    {
                        include_tax: true,
                    },
                );

                return {
                    ...found,
                    thumbnail: this.normalizeThumbUrl_(found?.thumbnail ?? ""),
                    price: `${this.humanPrice_(
                        totals.original_total / i.quantity,
                        currencyCode,
                    )} ${currencyCode}`,
                    discounted_price: `${this.humanPrice_(
                        totals.total / i.quantity,
                        currencyCode,
                    )} ${currencyCode}`,
                    quantity: i.quantity,
                };
            }),
        )) as unknown as LineItem[];

        const returnTotal = await this.totalsService_.getRefundTotal(
            order,
            returnItems,
        );

        const constructedOrder = {
            ...order,
            shipping_methods: swap.shipping_methods,
            items: swap.additional_items,
        } as Order;

        const additionalTotal =
            await this.totalsService_.getTotal(constructedOrder);

        const refundAmount = swap.return_order.refund_amount;

        const shipment = await this.fulfillmentService_.retrieve(
            fulfillment_id,
            {
                relations: ["tracking_links"],
            },
        );

        const locale = await this.extractLocale(order);

        return {
            email: order.email,
            locale,
            swap,
            order,
            items: await Promise.all(
                swap.additional_items.map(async (i: any) => {
                    const totals = await this.totalsService_.getLineItemTotals(
                        i,
                        cart,
                        {
                            include_tax: true,
                        },
                    );

                    return {
                        ...i,
                        thumbnail: this.normalizeThumbUrl_(i.thumbnail),
                        price: `${this.humanPrice_(
                            totals.original_total / i.quantity,
                            currencyCode,
                        )} ${currencyCode}`,
                        discounted_price: `${this.humanPrice_(
                            totals.total / i.quantity,
                            currencyCode,
                        )} ${currencyCode}`,
                        quantity: i.quantity,
                    };
                }),
            ),
            date: swap.updated_at.toDateString(),
            tax_amount: `${this.humanPrice_(
                cart.tax_total ?? 0,
                currencyCode,
            )} ${currencyCode}`,
            paid_total: `${this.humanPrice_(
                swap.difference_due,
                currencyCode,
            )} ${currencyCode}`,
            return_total: `${this.humanPrice_(
                returnTotal,
                currencyCode,
            )} ${currencyCode}`,
            refund_amount: `${this.humanPrice_(
                refundAmount,
                currencyCode,
            )} ${currencyCode}`,
            additional_total: `${this.humanPrice_(
                additionalTotal,
                currencyCode,
            )} ${currencyCode}`,
            fulfillment: shipment,
            tracking_links: shipment.tracking_links,
            tracking_number: shipment.tracking_numbers.join(", "),
        };
    }

    /**
     * ## `claimShipmentCreatedData`
     * Populates the data for the claim shipment created email
     */

    async claimShipmentCreatedData({ id, fulfillment_id }) {
        const claim = await this.claimService_.retrieve(id, {
            relations: ["order", "order.items", "order.shipping_address"],
        });

        const shipment = await this.fulfillmentService_.retrieve(
            fulfillment_id,
            {
                relations: ["tracking_links"],
            },
        );

        const locale = await this.extractLocale(claim.order);

        return {
            locale,
            email: claim.order.email,
            claim,
            order: claim.order,
            fulfillment: shipment,
            tracking_links: shipment.tracking_links,
            tracking_number: shipment.tracking_numbers.join(", "),
        };
    }

    /**
     * ## `restockNotificationData`
     * Populates the data for the restock notification email
     */

    async restockNotificationData({ variant_id, emails }) {
        const variant = await this.productVariantService_.retrieve(variant_id, {
            relations: ["product"],
        });

        let thumbnail: string = "";
        if (variant.product.thumbnail) {
            thumbnail = this.normalizeThumbUrl_(variant.product.thumbnail);
        }

        return {
            emails,
            product: {
                ...variant.product,
                thumbnail: thumbnail,
            },
            variant,
            variant_id,
        };
    }
}
