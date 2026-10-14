import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
export function receiver() {
  const sheets = new Map();
  const messages = [];
  let clock = Date.now(),
    mailFailure = false,
    quota = 100;
  const props = new Map([
    ["ACSL_SHEETS_TOKEN", "test-token-".repeat(4)],
    ["SPREADSHEET_ID", "test-sheet"],
  ]);
  let failSummary = false,
    locked = false,
    available = true;
  class Sheet {
    constructor(name) {
      this.name = name;
      this.rows = [];
    }
    getLastRow() {
      return this.rows.length;
    }
    setFrozenRows() {}
    getRange(row, col, height, width) {
      const range = {
        getValues: () =>
          Array.from({ length: height }, (_, r) =>
            Array.from(
              { length: width },
              (_, c) => this.rows[row + r - 1]?.[col + c - 1] ?? "",
            ),
          ),
        setValues: (values) => {
          if (failSummary && this.name === "제출 기록" && row > 1) {
            failSummary = false;
            throw new Error("Temporary sheet failure");
          }
          values.forEach((r, ri) => {
            this.rows[row + ri - 1] ??= [];
            r.forEach((v, ci) => (this.rows[row + ri - 1][col + ci - 1] = v));
          });
          return range;
        },
        setFontWeight: () => range,
        setNumberFormat: () => range,
      };
      return range;
    }
  }
  const book = {
    getId: () => "test-sheet",
    getSheetByName: (name) => sheets.get(name),
    insertSheet: (name) => {
      const s = new Sheet(name);
      sheets.set(name, s);
      return s;
    },
  };
  const context = vm.createContext({
    Date: class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [clock]));
      }
      static now() {
        return clock;
      }
    },
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail: (mail) => {
        if (mailFailure) throw new Error("Mail failed");
        messages.push(mail);
        quota--;
      },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      openById: () => book,
      flush() {},
      getUi: () => ({ alert() {}, ButtonSet: { OK: "ok" } }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props.get(k),
        setProperty: (k, v) => props.set(k, v),
      }),
    },
    Utilities: { getUuid: () => randomUUID() },
    console: { log() {} },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          locked = available;
          return available;
        },
        hasLock: () => locked,
        releaseLock: () => {
          locked = false;
        },
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ setMimeType: () => text }),
    },
  });
  vm.runInContext(
    readFileSync(
      new URL("../../public/setup/acsl-google-sheets.gs", import.meta.url),
      "utf8",
    ),
    context,
  );
  context.setup();
  return {
    sheets,
    context,
    props,
    messages,
    advance: (ms) => {
      clock += ms;
    },
    failMail: () => {
      mailFailure = true;
    },
    setQuota: (n) => {
      quota = n;
    },
    request: (
      actor,
      action,
      data = {},
      token = props.get("ACSL_SHEETS_TOKEN"),
    ) =>
      JSON.parse(
        context.doPost({
          postData: {
            contents: JSON.stringify({
              token,
              version: 2,
              actor,
              action,
              data,
            }),
          },
        }),
      ),
    legacy: () =>
      JSON.parse(
        context.doPost({
          postData: {
            contents: JSON.stringify({
              token: props.get("ACSL_SHEETS_TOKEN"),
              submission: {},
            }),
          },
        }),
      ),
    failNextSummary: () => {
      failSummary = true;
    },
    block: () => {
      available = false;
    },
    locked: () => locked,
  };
}
