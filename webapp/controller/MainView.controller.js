sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  function (Controller, JSONModel) {
    "use strict";

    const API_VERSION = "2023-05-15";

    return Controller.extend("com.sap.trial.fioriai.controller.MainView", {
      _sCsrfToken: null,

      onInit: function () {
        const oUiModel = new JSONModel({
          busy: false,
          summary: {
            txtInput: "",
            txtSummary: "",
          },
          chatbot: {
            txtInput: "",
            messages: [
              {
                role: "system",
                content: "You are a helpful AI Assistant who can help user queries about SAP technologies. Graciously to answer questions that are not related to SAP."
              },
              {
                role: "assistant",
                content: "Hello, I am your Chatbot. How can I help you?",
              }
            ],
          },
        });

        this.getView().setModel(oUiModel, "ui");
      },

      onBtnSummaryPress: async function () {
        const oUiModel = this.getView().getModel("ui");
        const sTxtInput = oUiModel.getProperty("/summary/txtInput");
        oUiModel.setProperty("/busy", true);
        const txtSummary = await this._apiChatCompletion([
          {
            role: "system",
            content:
              "Write a TL;DR/summary of the user content in a paragraph.",
          },
          {
            role: "user",
            content: sTxtInput,
          },
        ]);
        oUiModel.setProperty("/busy", false);
        oUiModel.setProperty("/summary/txtSummary", txtSummary);
      },

      onBtnChatbotSendPress: async function () {
        const oUiModel = this.getView().getModel("ui");
        const txtInput = oUiModel.getProperty("/chatbot/txtInput");
        const oMessages = [
          ...oUiModel.getProperty("/chatbot/messages"),
          {
            role: "user",
            content: txtInput
          },
        ];
        oUiModel.setProperty("/chatbot/messages", oMessages);
        oUiModel.setProperty("/chatbot/txtInput", "");
        oUiModel.setProperty("/busy", true);
        const txtSummary = await this._apiChatCompletion(oMessages);
        oUiModel.setProperty("/busy", false);
        oMessages.push({
          role: "assistant",
          content: txtSummary
        });
        oUiModel.setProperty("/chatbot/messages", oMessages);
      },

      /**
       * Gets the URL prefix of the app
       * @returns {string} the URL module prefix
       */
      _getUrlModulePrefix() {
        return $.sap.getModulePath(
          this.getOwnerComponent().getManifestEntry("/sap.app/id")
        );
      },

      /**
       * API - fetches CSRF token
       *
       * **Note**: For testing/development, you can turn off CSRF protection in the `xs-app.json`
       * by setting `csrfProtection: false` for `"source": "^/api/(.*)$"` route.
       */
      _apiFetchCsrfToken: async function () {
        if (!this._sCsrfToken) {
          const res = await fetch(`${this._getUrlModulePrefix()}/index.html`, {
            method: "HEAD",
            headers: {
              "X-CSRF-Token": "fetch",
            },
            credentials: "same-origin",
          });
          this._sCsrfToken = res.headers.get("x-csrf-token");
        }
        return this._sCsrfToken;
      },

      /**
       * API - generates a summary by making an API call to GenAI Hub
       * @param {Object[]} oMessages an array of messages
       * @returns {Promise<string>} chat completion
       */
      _apiChatCompletion: async function (oMessages) {
        const res = await fetch(
          `${this._getUrlModulePrefix()}/api/chat/completions?api-version=${API_VERSION}`,
          {
            method: "POST",
            headers: {
              "X-CSRF-Token": await this._apiFetchCsrfToken(),
              "Content-Type": "application/json",
              "AI-Resource-Group": "default",
            },
            credentials: "same-origin",
            body: JSON.stringify({
              messages: oMessages,
            }),
          }
        );
        const resData = await res.json();
        // extract the message content of first choice
        return resData.choices[0].message.content;
      },
    });
  }
);
