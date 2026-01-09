async function buyNow() {
  try {
    // 1️⃣ Create order from backend
    const response = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 19900, // Amount in paise (₹199 = 19900)
        currency: "INR"
      })
    });

    if (!response.ok) {
      throw new Error("Order creation failed");
    }

    const order = await response.json();

    // 2️⃣ Razorpay checkout options
    var options = {
      key: "rzp_test_S0eeQglGbygi4C", // ONLY Key ID
      amount: order.amount,
      currency: order.currency,
      name: "Prashant Resume Store",
      description: "Modern Resume Template",
      order_id: order.id,

      handler: async function (response) {
        try {
          // 3️⃣ Verify payment on backend
          const verifyRes = await fetch("https://razorpay-backend-ke6v.onrender.com/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const result = await verifyRes.json();

          if (result.success) {
            alert("✅ Payment verified successfully!");
          } else {
            alert("❌ Payment verification failed!");
          }
        } catch (err) {
          console.error("Verification Error:", err);
          alert("Verification error occurred");
        }
      },

      modal: {
        ondismiss: function () {
          alert("Payment cancelled");
        }
      },

      prefill: {
        name: "Prashant",
        email: "test@example.com",
        contact: "9999999999"
      },

      theme: {
        color: "#3399cc"
      }
    };

    var rzp = new Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again.");
  }
}
