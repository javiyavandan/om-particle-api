import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import {
  MAIL_FROM,
  MAIL_HOST,
  MAIL_PASSWORD,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER_NAME,
} from "../config/env.var";
import puppeteer from "puppeteer";
const nodemailer = require("nodemailer");

export default class EmailHelper {
  private _transporter: any;
  private _emailTemplate: any;
  private _contentToReplace: any;
  private _emailTo: any = [];
  private _emailSubject: any;
  private _messageType: any;
  private _attachments: any;

  constructor() {
    this._transporter = nodemailer.createTransport({
      name: MAIL_HOST,
      host: MAIL_HOST,
      port: MAIL_PORT,
      secureConnection: MAIL_SECURE,
      auth: {
        user: MAIL_USER_NAME,
        pass: MAIL_PASSWORD,
      },
    });
  }

  public async prepareEmail(payload: any) {
    this._emailTemplate = payload.emailTemplate;
    this._emailSubject = payload.subject;
    this._contentToReplace = payload.contentToReplace;
    this._emailTo = payload.emailTo;
    this._messageType = payload.messageType;
    this._attachments = payload.attachments;
  }

  public async sendMail() {
    const filePath = path.join(__dirname, this._emailTemplate);
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);
    const contentReplacements = this._contentToReplace;
    const htmlToSend = template(contentReplacements);
    let htmlToSendFile: any;
    let pdf: any;
    if (this._attachments) {
      const filePathAttachments = path.join(
        __dirname,
        this._attachments.content
      );
      const sourceAttachments = fs
        .readFileSync(filePathAttachments, "utf-8")
        .toString();
      const templateFile = handlebars.compile(sourceAttachments);
      const contentReplacement = this._attachments.toBeReplace;
      htmlToSendFile = templateFile(contentReplacement);
      const browser = await puppeteer.launch({
        headless: "new" as any,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(htmlToSendFile, { waitUntil: "domcontentloaded" });

      await page.emulateMediaType("screen");
      pdf = await page.pdf();

      await browser.close();
    }

    try {

      if (htmlToSendFile) {
        const sendMailResult = await this._transporter.sendMail({
          from: MAIL_FROM,
          to: this._emailTo,
          subject: this._emailSubject,
          html: htmlToSend,
          attachments: [
            {
              filename: `Invoice-${this._attachments.toBeReplace.invoice_number}.pdf`,
              content: pdf,
            },
          ],
        });

      } else {
        const sendMailResult = await this._transporter.sendMail({
          from: MAIL_FROM,
          to: this._emailTo,
          subject: this._emailSubject,
          html: htmlToSend,
        });

      }

      // const setConversationData = {
      //   mailResponse: sendMailResult,
      //   recipient: this._emailTo,
      //   type: this._messageType,
      //   subject: this._emailSubject,
      //   body: htmlToSend,
      //   id: null,
      // };
      // await setConversationHistories(setConversationData);
    } catch (err) {
      // saveErrorLogToFile(
      //   {
      //     body: "",
      //     headers: { authorization: "" },
      //     originalUrl: "",
      //     method: "",
      //   },
      //   DEFAULT_STATUS_CODE_ERROR,
      //   err,
      //   this._emailSubject,
      //   false
      // );
    }
  }

  public async reSendMail(payload: any) {
    const { emailTo, emailSubject, htmlToSend, id } = payload;

    try {
      const sendMailResult = await this._transporter.sendMail({
        from: MAIL_FROM,
        to: emailTo,
        subject: emailSubject,
        html: htmlToSend,
      });

      // const setConversationData = {
      //   mailResponse: sendMailResult,
      //   recipient: emailTo,
      //   type: null,
      //   subject: emailSubject,
      //   body: htmlToSend,
      //   id: id,
      // };
      // await setConversationHistories(setConversationData);
    } catch (err) {
      // saveErrorLogToFile(
      //   {
      //     body: "userInfo",
      //     headers: { authorization: "" },
      //     originalUrl: "/api/forgot-password",
      //     method: "",
      //   },
      //   DEFAULT_STATUS_CODE_ERROR,
      //   err,
      //   emailTo
      // );
    }
  }
}
