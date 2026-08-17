import EmailService from "./email.service";

export interface SalesOrderAssignmentNotificationOptions {
  to: string;
  userName: string;
  dveplCode: string;
}

export class NotificationService {
  /**
   * Send email notification when a Sales Order is assigned to a user.
   */
  static async sendSalesOrderAssignmentNotification(
    options: SalesOrderAssignmentNotificationOptions,
    companyId?: string,
  ) {
    const { to, userName, dveplCode } = options;

    const subject = `Sales Order ${dveplCode} Assigned to You`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Sales Order Assigned</title>
        </head>

        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">

            <div style="padding: 24px; background: #111827; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px;">
                Sales Order Assigned
              </h2>
            </div>

            <div style="padding: 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #111827;">
                Hello <strong>${userName}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                A Sales Order has been assigned to you in the DVEPL ERP system.
              </p>

              <div style="padding: 16px; margin-bottom: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">
                  SALES ORDER
                </p>

                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
                  ${dveplCode}
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                Please log in to the DVEPL ERP system to review the order and take the necessary action.
              </p>
            </div>

            <div style="padding: 20px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                This is an automated notification from DVEPL ERP.
              </p>

              <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">
                Regards,<br />
                <strong>DVEPL Team</strong>
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    return EmailService.send({
      to,
      subject,
      html,
    }, companyId);
  }

  /**
   * Send a generic custom notification (for POs, Drawings, Tasks, etc.).
   */
  static async sendCustomNotification(
    options: {
      to: string;
      subject: string;
      message: string;
      eventCode?: string;
      relatedModule?: string;
      relatedRecordId?: string;
    },
    companyId?: string,
  ) {
    const { to, subject, message, eventCode, relatedModule, relatedRecordId } = options;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="padding: 24px; background: #1f2937; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px;">${subject}</h2>
            </div>
            <div style="padding: 32px 24px;">
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                ${message}
              </p>
            </div>
            <div style="padding: 20px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                This is an automated notification from DVEPL ERP.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return EmailService.send({
      to,
      subject,
      html,
    }, companyId, eventCode, relatedModule, relatedRecordId);
  }
}

export default NotificationService;