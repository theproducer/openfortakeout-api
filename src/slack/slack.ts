import express, { Request, Response, Express } from 'express';
import Sentry from '@sentry/node';
import { createMessageAdapter } from '@slack/interactive-messages';
import { IBusinessServices, Business } from '../businesses/business.interface';

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

    slackInteractions.action(
        {
            actionId: 'admin_approve_correction',
        },
        async (payload, respond) => {
            const correctionId = parseInt(payload.actions[0].value, 10);

            try {
                const correction = await service.getCorrection(correctionId);

                if (correction) {
                    correction.approved = true;
                    const business = await service.getBusiness(correction.business_id, true);
                    if (business) {
                        business.type = correction.type;
                        business.tags = correction.tags;
                        business.phone = correction.phone;
                        business.details = correction.details;
                        business.hours = correction.hours;
                        business.url = correction.url;
                        business.donateurl = correction.donateurl;
                        business.giftcard = correction.giftcard;
                        business.takeout = correction.takeout;
                        business.delivery = correction.delivery;
                        business.closed = correction.closed;

                        await service.updateBusiness(business);
                        await service.updateCorrection(correction);

                        respond({
                            text: `Correction for ${business.name} has been approved by ${payload.user.username}`,
                        });
                    } else {
                        respond({
                            text: `There was a problem approving entry id: ${correction.business_id} could not be found.`,
                        });
                    }
                } else {
                    respond({
                        text: `There was a problem approving correction id: ${correctionId} could not be found.`,
                    });
                }
            } catch (err) {
                Sentry.captureException(err);
                console.error(err);
                respond({
                    text: `There was a problem approving entry id: ${correctionId}, see Sentry error report.`,
                });
            }
        },
    );
}
