import {
    SendSmtpEmail,
    TransactionalEmailsApi,
    TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";
import { AbstractNotificationService, OrderService } from "@medusajs/medusa";

export type BrevoNotificationServiceOptions = {
    api_key: string;
    from: {
        name: string;
        email: string;
    };
    // Map of event to Brevo Template Id
    template_map: {
        [event: string]: number;
    };
};

export class BrevoNotificationService extends AbstractNotificationService {
    static identifier = "brevo";
    protected config_: BrevoNotificationServiceOptions;
    protected brevo_: TransactionalEmailsApi;
    protected orderService: OrderService;

    constructor(container, options: BrevoNotificationServiceOptions) {
        super(container);

        this.orderService = container.orderService;

        this.config_ = {
            api_key: options.api_key,
            from: options.from,
            template_map: options.template_map,
        };

        this.brevo_ = new TransactionalEmailsApi();

        this.brevo_.setApiKey(
            TransactionalEmailsApiApiKeys.apiKey,
            this.config_.api_key,
        );
    }

    async sendNotification(
        event: string,
        data: any,
        attachmentGenerator: unknown,
    ): Promise<{
        event: string;
        to: string;
        status: string;
        data: Record<string, unknown>;
    }> {
        if (event === "order.placed") {
            const order = await this.orderService.retrieve(data.id);

            let smtpEmail = new SendSmtpEmail();
            smtpEmail.templateId = this.config_.template_map[event];

            smtpEmail.sender = {
                name: this.config_.from.name,
                email: this.config_.from.email,
            };

            smtpEmail.to = [
                {
                    email: order.email,
                },
            ];

            smtpEmail.params = data as { [key: string]: any } | undefined;

            await this.brevo_.sendTransacEmail(smtpEmail);
            console.log("Brevo Notification sent", data);

            return {
                event: event,
                to: order.email,
                status: "done",
                data: data,
            };
        }

        return {
            event: event,
            to: "",
            status: "failed",
            data: data,
        };
    }

    async resendNotification(
        notification: any,
        config: any,
        attachmentGenerator: unknown,
    ): Promise<{
        event: string;
        to: string;
        status: string;
        data: Record<string, unknown>;
    }> {
        // check if the receiver should be changed
        const to: string = config.to || notification.to;

        // TODO resend the notification using the same data
        // that is saved under notification.data
        this.sendNotification(
            notification.event,
            notification.data,
            attachmentGenerator,
        );

        console.log("Brevo Notification resent", notification.data);
        return {
            event: notification.event,
            to,
            status: "done",
            data: notification.data, // make changes to the data
        };
    }
}
