import { NotificationService } from "@medusajs/medusa";
import { BrevoSupportedEvents } from "../types";

class BrevoSubscriber {
    protected notificationService_: NotificationService;

    /**
     * @param {NotificationService} notificationService - Notification service
     */
    constructor({ notificationService }) {
        this.notificationService_ = notificationService;

        const supportedEvents: BrevoSupportedEvents[] = [
            /* User */
            "user.created",
            "user.updated",

            /* Customer */
            "customer.created",
            "customer.updated",
            "customer.password_reset",
            "invite.created",

            /* Product Variant Restock */
            "estock-notification.restocked",

            /* Order */
            "order.placed",
            "order.updated",
            "order.canceled",
            "order.completed",
            "order.orders_claimed",
            "order.refund_created",

            /* Order Payment */
            "order.payment_captured",
            "order.payment_capture_failed",

            /* Order Claim */
            "claim.shipment_created",

            /* Order Swap */
            "swap.created",
            "swap.shipment_created",
            "swap.received",

            /* Order Fulfillment */
            "order.fulfillment_created",
            "order.fulfillment_canceled",

            /* Order Shipment */
            "order.shipment_created",

            /* Gift Card */
            "order.gift_card_created",
            "gift_card.created",
        ];

        for (const event of supportedEvents) {
            this.notificationService_.subscribe(event, "brevo");
        }
    }
}

export default BrevoSubscriber;
