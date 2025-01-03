import { APP_NAME, IMAGE_PATH } from "../config/env.var";
import EmailHelper from "../helpers/EmailHelper.helper";
import { MESSAGE_TYPE } from "../utils/app-enumeration";
async function prepareAndSendEmail(
  mailTemplate: string,
  mailSubject: string,
  messageType: number,
  payload: any
) {
  try {
    //   const companyInfo = await <any>CompanyInfo.findOne({
    //     where: { id: 1 },
    //     attributes: [
    //       "id",
    //       "company_name",
    //       "company_email",
    //       "company_phone",
    //       "copy_right",
    //       "sort_about",
    //       "web_link",
    //       "facebook_link",
    //       "insta_link",
    //       "youtube_link",
    //       "linkdln_link",
    //       "twitter_link",
    //       "web_primary_color",
    //       "web_secondary_color",
    //       "light_id_image",
    //       'company_phone',
    //       "dark_id_image"
    //     ],
    //   });

    //   const darkImagedata = await Image.findOne({ where: { id: companyInfo.dataValues.dark_id_image } })

    payload = {
      ...payload,
      contentTobeReplaced: {
        ...payload?.contentTobeReplaced,
        app_name: APP_NAME,
        //   insta_url: companyInfo?.insta_link,
        //   insta_logo: IMAGE_PATH + "/static/insta.png",
        //   twiiter_url: companyInfo?.twitter_link,
        //   twitter_logo: IMAGE_PATH + "/static/twitter.png",
        //   facebook_url: companyInfo?.facebook_link,
        //   facbook_logo: IMAGE_PATH + "/static/facbook.png",
        //   youtube_url: companyInfo?.youtube_link,
        //   youtube_logo: IMAGE_PATH + "/static/youtube.png",
        //   linked_url: companyInfo?.linkdln_link,
        //   linked_logo: IMAGE_PATH + "/static/linkedin.png",
        logo_image: IMAGE_PATH,
        //   frontend_url :  companyInfo.web_link,
        //   app_name : companyInfo?.company_name,
        //   company_phone: companyInfo?.company_phone,
        //   support_email : companyInfo?.company_email
      },
    };
    const objMail = new EmailHelper();

    const mailInfo = {
      emailTemplate: mailTemplate,
      subject: mailSubject,
      contentToReplace: payload.contentTobeReplaced,
      emailTo: payload.toEmailAddress,
      messageType: messageType,
      attachments: payload.attachments,
    };
    await objMail.prepareEmail(mailInfo);
    objMail.sendMail();
  } catch (e) {}
}

export const mailRegistationOtp = async (payload: any) => {
  const emailTemplate =
    "../../../templates/mail-template/customer-verified-otp.html";
  const subject = "User sign up OTP verification";
  await prepareAndSendEmail(emailTemplate, subject, MESSAGE_TYPE.Otp, payload);
};

export const mailPasswordResetLink = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/reset-password.html";
  const subject = "Reset your " + APP_NAME + " account password";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Credential,
    payload
  );
};

export const mailNewOrderReceived = async (payload: any) => {
  const emailTemplate =
    "../../../templates/mail-template/when-user-order-purchase.html";
  const subject = `Thank You for Your Order #${payload.contentTobeReplaced.toBeReplace.order_number} !`;
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.NewOrder,
    payload
  );
};

export const mailNewOrderAdminReceived = async (payload: any) => {
  const emailTemplate =
    "../../../templates/mail-template/new-order-received-admin.html";
  const subject = "New order received";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.NewOrder,
    payload
  );
};

export const mailContactUs = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/contact-us.html";
  const subject = "Contact us";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.ContactUs,
    payload
  );
};

export const mailDiamondConcierge = async (payload: any) => {
  const emailTemplate =
    "../../../templates/mail-template/diamondConcierge.html";
  const subject = "diamond Concierge";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.DiamondConcierge,
    payload
  );
};

export const mailAdminDiamondConcierge = async (payload: any) => {
  const emailTemplate =
    "../../../templates/mail-template/diamondConcierge.html";
  const subject = "diamond Concierge";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.DiamondConcierge,
    payload
  );
};

export const mailUserVerified = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/user-verified.html";
  const subject = "Approval !";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.UserVerify,
    payload
  );
};
