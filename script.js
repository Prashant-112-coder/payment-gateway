async function buyNow() {
  try {
    const response = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9900,
        currency: "INR"
      })
    });

    const data = await response.json();
    console.log("Order Response:", data);

    // ✅ Handle BOTH backend formats
    let order;
    if (data.id) {
      // Format: order object directly
      order = data;
    } else if (data.success && data.order) {
      // Format: { success: true, order: {...} }
      order = data.order;
    } else {
      alert("❌ Order creation failed");
      return;
    }

    // 2️⃣ Razorpay checkout
    var options = {
      key: "rzp_test_S0eeQglGbygi4C",
      amount: order.amount,
      currency: order.currency,
      name: "Prashant",
      description: "Resume Template",
      order_id: order.id,

      handler: async function (response) {
        console.log("Razorpay Response:", response);

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

      theme: { color: "#2b7cff" }
    };

    var rzp = new Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error("Buy Now Error:", error);
    alert("Something went wrong. Check console.");
  }
}
