import { BrevoSupportedEvents } from "../types";

export type SendOptions = {
    templateId: number;
    to_email: string;
    from_email: string;
    from_name: string;
    admin_email: string;
    data: any;
};

export type BrevoServiceOptions = {
    /**
     * ## `api_key`
     * [How to create an API key? (Brevo)](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys#h_01GW6ZQEKZ072SFGK03N9R6VE6)
     */
    api_key: string;

    /**
     * ## `from`
     * Email address and name to send emails from
     * - It is recommended to use a no-reply email address (e. g. noreply@example.com)
     * - It is recommended to use a domain that is verified with Brevo (Brevo code, DKIM record, DMARC record)
     *
     * [How to create a sender? (Brevo) ](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender#h_01HMZWMQ1C30B5GT08VWZG2V77)
     *
     * [How to authenticate you domain? (Brevo)](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-record-DMARC-record)
     */
    from: {
        name: string;
        email: string;
    };
    /**
     * ## `events`
     * List of Medusa.js Events to subscribe to
     * [Medusa.js Events Reference](https://docs.medusajs.com/development/events/events-list)
     */
    events: {
        event: BrevoSupportedEvents;
        /**
         * ## `templateId`
         * Brevo Template Id
         */
        templateId: number;

        /**
         * ## `email`
         * Either automatically send to the user's email or specify an email adress manually.
         */
        email: "auto" | string;

        /**
         * ## `copy_to`
         * Copy emails bound to that specific Medusa.js Event to another email address (e.g. admin email for logging or debugging purposes)
         */
        copy_to?: string | undefined;
    }[];

    /**
     * ## `copy_to`
     * Sends a copy of every email to this email address (e.g. admin email for logging or debugging purposes)
     */
    copy_to?: string | undefined;
};
