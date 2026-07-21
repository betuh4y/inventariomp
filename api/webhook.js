const { MercadoPagoConfig, Payment } = require("mercadopago");

const FIREBASE_DB = "https://pdv1-77632-default-rtdb.firebaseio.com";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const paymentId =
      req.body?.data?.id || req.query?.["data.id"] || req.query?.id;

    if (!paymentId) return res.status(200).json({ ok: true });

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = new Payment(client);
    const info = await payment.get({ id: paymentId });

    if (info.status === "approved" && info.external_reference) {
      const uid = info.external_reference;
      await fetch(`${FIREBASE_DB}/pagamentos/${uid}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pago: true,
          paymentId: paymentId,
          valor: info.transaction_amount,
          data: new Date().toISOString()
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    // Retorna 200 para o MP não ficar reenviando
    return res.status(200).json({ ok: true });
  }
};
