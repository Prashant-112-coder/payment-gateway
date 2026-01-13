async function buyNow() {
  try {
    // 1️⃣ Create order
    const response = await fetch("http://localhost:10000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9900,   // ₹99 in paise
        currency: "INR"
      })
    });

    const data = await response.json();
    console.log("Order Response:", data);

    if (!data.success) {
      alert("❌ Order creation failed");
      return;
    }

    const order = data.order;

    // 2️⃣ Razorpay checkout
    var options = {
      key: "rzp_test_S0eeQglGbygi4C", // ONLY Key ID (not secret)
      amount: order.amount,
      currency: order.currency,
      name: "ResumePro",
      description: "Resume Template",
      order_id: order.id,

      handler: async function (response) {
        console.log("Razorpay Response:", response);

        // 3️⃣ Verify payment
        const verifyRes = await fetch("http://localhost:10000/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });

        const result = await verifyRes.json();
        console.log("Verify Response:", result);

        if (result.success) {
          alert("✅ Payment Successful!");
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
