module.exports = {
  env: "production",
  firebaseConfig: {
    apiKey: process.env.FIREBASE_CLIENT_API_KEY,
    authDomain: process.env.FIREBASE_CLIENT_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_CLIENT_PROJECT_ID,
    storageBucket: process.env.FIREBASE_CLIENT_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_CLIENT_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_CLIENT_APP_ID,
    measurementId: process.env.FIREBASE_CLIENT_MEASUREMENT_ID,
  },
  serviceAccount: {
    type: process.env.FIREBASE_ADMIN_TYPE,
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
  },
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  smtpConfig: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  gcloudConfig: {
    private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
  },
  sinchConfig: {
    servicePlanId: process.env.SINCH_SERVICE_PLAI_ID,
    apiToken: process.env.SINCH_API_TOKEN,
    sinchNumber: process.env.SINCH_NUMBER,
  },
};
