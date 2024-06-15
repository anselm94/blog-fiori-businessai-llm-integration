sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    function (Controller) {
        "use strict";

        const API_VERSION = '2023-05-15';

        return Controller.extend("com.sap.trial.fioriai.controller.MainView", {
            getUrlModulePrefix() {
                return $.sap.getModulePath(this.getOwnerComponent().getManifestEntry("/sap.app/id"))
            },

            onBtnSummaryPress: async function () {
                const txt = await this._apiGenerateSummary();
                this.getView().byId('txtSummary').setText(txt);
            },

            /**
             * API - fetches CSRF token
             * 
             * **Note**: For testing/development, you can turn off CSRF protection in the `xs-app.json`
             * by setting `csrfProtection: false` for `"source": "^/api/(.*)$"` route.
             */
            _apiFetchCsrfToken: async function() {
                const res = await fetch(`${this.getUrlModulePrefix()}/index.html`, {
                    method: 'HEAD',
                    headers: {
                        'X-CSRF-Token': 'fetch'
                    },
                    credentials: 'same-origin'
                });
                return res.headers.get('x-csrf-token');
            },

            /**
             * API - generates a summary by making an API call to GenAI Hub
             */
            _apiGenerateSummary: async function() {
                const res = await fetch(`${this.getUrlModulePrefix()}/api/chat/completions?api-version=${API_VERSION}`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-Token': await this._apiFetchCsrfToken(),
                        'Content-Type': 'application/json',
                        'AI-Resource-Group': 'default'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        "messages": [
                            {
                                "role": "user",
                                "content": "Your task is to generate a short summary of a product review from an ecommerce site. Summarize the review below, delimited by triple backticks, in at most 30 words. Review:\n```Got this panda plush toy for my daughter's birthday, who loves it and takes it everywhere. It's soft and super cute, and its face has a friendly look. It's a bit small for what I paid though. I think there might be other options that are bigger for the same price. It arrived a day earlier than expected, so I got to play with it myself before I gave it to her. ```"
                            }
                        ]
                    }
                    )
                });
                const resData = await res.json();

                // extract the message content of first choice
                return resData.choices[0].message.content;
            }
        });
    });
