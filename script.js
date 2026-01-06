async function buyNow() {
  try {
    // 1️⃣ Call backend to create order
    const response = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST"
    });

    const order = await response.json();

    // 2️⃣ Razorpay checkout options
    var options = {
      key: "rzp_test_S0XIpEgyHXKHef", // 🔁 put your Razorpay TEST KEY here
      amount: order.amount,
      currency: order.currency,
      name: "Prashant Resume Store",
      description: "Modern Resume Template",
      order_id: order.id,

      handler: async function (response) {
        // 3️⃣ Verify payment on backend
        const verifyRes = await fetch("https://razorpay-backend-ke6v.onrender.com/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });

        const result = await verifyRes.json();

        if (result.success) {
          alert("Payment verified successfully! You can now download your resume.");
        } else {
          alert("Payment verification failed!");
        }
      }
    };

    var rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again.");
  }
}
