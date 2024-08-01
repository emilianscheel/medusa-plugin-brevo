import { ModuleProviderExports } from "@medusajs/types";
import BrevoNotificationService from "./services/brevo";

const services = [BrevoNotificationService];

const providerExport: ModuleProviderExports = {
    services,
};

export default providerExport;

export * from "./types";
export * from "./services/types";
