import express, { Request, Response, Express } from 'express';
import Sentry from '@sentry/node';
import { createMessageAdapter } from '@slack/interactive-messages';
import { IBusinessServices } from '../businesses/business.interface';

export default function SlackController(app: Express, service: IBusinessServices) {
    const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET as string);
    app.use('/slackwebhook', slackInteractions.requestListener());

    slackInteractions.action(
        {
            actionId: 'admin_approve_submission',
        },
        async (payload, respond) => {
            const businessId = parseInt(payload.actions[0].value, 10);

            try {
                const business = await service.getBusiness(businessId, true);
                console.log(business);
                if (business) {
                    business.active = true;
                    await service.updateBusiness(business);

                    respond({
                        text: `${business.name} has been approved by ${payload.user.username}`,
                    });
                } else {
                    respond({
                        text: `There was a problem approving entry id: ${businessId} could not be found.`,
                    });
                }
            } catch (err) {
                Sentry.captureException(err);
                console.error(err);
                respond({
                    text: `There was a problem approving entry id: ${businessId}, see Sentry error report.`,
                });
            }
        },
    );
}
