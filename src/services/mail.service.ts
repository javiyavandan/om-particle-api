import { APP_NAME, FRONT_END_BASE_URL, IMAGE_PATH } from "../config/env.var";
import EmailHelper from "../helpers/EmailHelper.helper";
import { MESSAGE_TYPE } from "../utils/app-enumeration";

async function prepareAndSendEmail(
  mailTemplate: string,
  mailSubject: string,
  messageType: number,
  payload: any
) {
  try {
    payload = {
      ...payload,
      contentTobeReplaced: {
        ...payload?.contentTobeReplaced,
        app_name: APP_NAME,
        instagram: "https://www.instagram.com/omparticlellp/",
        facebook: "https://www.facebook.com/profile.php?id=61552838724840",
        twitter: "https://x.com/OMParticleLLP?mx=2",
        pinterest: "https://in.pinterest.com/omparticlellp/",
        logo_image: IMAGE_PATH,
        frontend_url: FRONT_END_BASE_URL
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
  } catch (e) {
    console.log(e)
  }
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

export const mailAdminMemo = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/admin-memo.html";
  const subject = "Memo";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Memo,
    payload
  );
};

export const mailCustomerMemo = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/customer-memo.html";
  const subject = "Memo";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Memo,
    payload
  );
};

export const mailAdminInvoice = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/admin-invoice.html";
  const subject = "Invoice";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Invoice,
    payload
  );
};

export const mailCustomerInvoice = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/customer-invoice.html";
  const subject = "Invoice";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Invoice,
    payload
  );
};

export const mailAdminInquiry = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/admin-inquiry.html";
  const subject = "Inquiry";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Inquiry,
    payload
    );
}

export const mailCustomerInquiry = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/customer-inquiry.html";
  const subject = "Inquiry";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Inquiry,
    payload
    );
}

export const mailAdminProductInquiry = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/admin-inquiry-product.html";
  const subject = "Inquiry";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Inquiry,
    payload
    );
}

export const mailCustomerProductInquiry = async (payload: any) => {
  const emailTemplate = "../../../templates/mail-template/customer-inquiry-product.html";
  const subject = "Inquiry";
  await prepareAndSendEmail(
    emailTemplate,
    subject,
    MESSAGE_TYPE.Inquiry,
    payload
    );
}