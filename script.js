async function buyNow() {
  try {
    // 1️⃣ Create order
    const response = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST"
    });
    const order = await response.json();

    // 2️⃣ Razorpay checkout
    var options = {
      key: "rzp_test_XXXXXXXXXX", // your test key
      amount: order.amount,
      currency: order.currency,
      name: "Prashant Resume Store",
      description: "Modern Resume Template",
      order_id: order.id,

      handler: async function (response) {
        const verifyRes = await fetch("https://razorpay-backend-ke6v.onrender.com/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });

        const result = await verifyRes.json();

        if (result.success) {
          alert("Payment verified successfully!");
        } else {
          alert("Payment verification failed!");
        }
      }
    };

    var rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong.");
  }
}
