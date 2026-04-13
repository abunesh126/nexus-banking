const { app } = require('@azure/functions');
// Optionally initialize Application Insights if connection string is present
try {
    const ai = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (ai) {
        // require lazily so local dev without the package still works
        const appInsights = require('applicationinsights');
        appInsights.setup(ai).start();
        appInsights.defaultClient.commonProperties = { function: 'CurrencyConverter' };
        console.log('Application Insights initialized for CurrencyConverter');
    }
} catch (e) {
    console.warn('Failed to initialize Application Insights:', e.message || e);
}

app.http('CurrencyConverter', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // Accept amount & currency from query string or JSON body
        let amount = request.query.get('amount');
        let currency = request.query.get('currency');

        if (!amount || !currency) {
            // Try JSON body
            try {
                const body = await request.json();
                if (body) {
                    amount = amount || body.amount;
                    currency = currency || body.currency;
                }
            } catch (e) {
                // fallback: try plain text then parse
                try {
                    const txt = await request.text();
                    if (txt) {
                        const parsed = JSON.parse(txt);
                        amount = amount || parsed.amount;
                        currency = currency || parsed.currency;
                    }
                } catch (err) {
                    // ignore parse errors
                }
            }
        }

        if (amount === undefined || currency === undefined || amount === null || currency === null) {
            return {
                status: 400,
                body: { error: 'Please pass a valid amount and target currency.' },
            };
        }

        const num = Number(amount);
        if (Number.isNaN(num)) {
            return { status: 400, body: { error: 'Amount must be a number' } };
        }

        const rates = { USD: 0.012, EUR: 0.011, GBP: 0.0094 };
        const rate = rates[String(currency).toUpperCase()];

        if (!rate) {
            return { status: 400, body: { error: 'Unsupported currency' } };
        }

        const convertedAmount = num * rate;

        return {
            // Defaults to 200
            body: {
                originalAmount: num,
                currency: String(currency).toUpperCase(),
                exchangeRate: rate,
                convertedAmount: convertedAmount.toFixed(2),
                timestamp: new Date().toISOString(),
            },
        };
    },
});
