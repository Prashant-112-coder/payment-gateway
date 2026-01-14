async function buyNow() {
  try {
    // 1️⃣ Create order
    const response = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9900,   // ₹99 in paise
        currency: "INR"
      })
    });

    const data = await response.json();
    console.log("Order Response:", data);

    // Handle different response shapes from backend
    if (!response.ok) {
      console.error("Create order request failed:", response.status, data);
      alert("❌ Order creation failed — check console for details.");
      return;
    }

    const orderId = data.id || data.order_id || data.order?.id || data.orderId || (data.data && data.data.id);
    const orderAmount = data.amount || data.order?.amount || (data.data && data.data.amount) || 9900;
    const orderCurrency = data.currency || data.order?.currency || (data.data && data.data.currency) || "INR";

    if (!orderId) {
      console.error("Order creation response missing id:", data);
      alert("❌ Order creation failed — check console for details.");
      return;
    }

    const order = { id: orderId, amount: orderAmount, currency: orderCurrency };

    // 2️⃣ Razorpay checkout
    var options = {
      key: "rzp_test_S0eeQglGbygi4C", // ONLY Key ID
      amount: order.amount,
      currency: order.currency,
      name: "Prashant",
      description: "Resume Template",
      order_id: order.id,

      handler: async function (response) {
        console.log("Razorpay Response:", response);

        // 3️⃣ Verify payment
        const verifyRes = await fetch("https://razorpay-backend-ke6v.onrender.com/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });

        const result = await verifyRes.json();
        console.log("Verify Response:", result);

        if (result.success) {
          showSuccessPopup(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            options.amount
          );
        } else {
          alert("❌ Payment Verification Failed");
        }
      },

      prefill: {
        name: "Prashant",
        email: "test@example.com",
        contact: "9999999999"
      },

      theme: {
        color: "#2b7cff"
      }
    };

    var rzp = new Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error("Buy Now Error:", error);
    alert("Something went wrong. Check console.");
  }
}