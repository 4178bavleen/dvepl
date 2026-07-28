// import {
//   FastifyInstance,
//   FastifyPluginOptions,
//   FastifyReply,
//   FastifyRequest,
// } from "fastify";

// import EmailService from "../../../../services/notification/email.service";

// interface Body {
//   to: string;
// }

// async function adminNotificationTestEmailRoutes(
//   fastify: FastifyInstance,
//   options: FastifyPluginOptions
// ) {
//   fastify.post(
//     "/email",
//     async (
//       request: FastifyRequest<{ Body: Body }>,
//       reply: FastifyReply
//     ) => {
//       try {
//         await EmailService.send({
//           to: request.body.to,
//           subject: "DVEPL Notification Test",
//           html: `
//             <h2>Email Configuration Successful</h2>

//             <p>This is a test email from DVEPL ERP.</p>

//             <hr/>

//             <p>If you received this email, SMTP is working correctly.</p>
//           `,
//         });

//         return reply.send({
//           success: true,
//           message: "Test email sent successfully.",
//         });
//       } catch (error: any) {
//         return reply.status(500).send({
//           success: false,
//           message: error.message,
//         });
//       }
//     }
//   );
// }

// export default adminNotificationTestEmailRoutes;