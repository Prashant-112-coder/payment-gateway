async function buyNow() {
  try {
    // 1️⃣ CREATE ORDER
    const res = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9900, // ₹99 in paise
        currency: "INR"
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Create order failed:", text);
      alert("Order creation failed");
      return;
    }

    const data = await res.json();

    if (!data.success || !data.order) {
      console.error("Invalid order response:", data);
      alert("Order creation failed");
      return;
    }

    const order = data.order;

    // 2️⃣ RAZORPAY OPTIONS
    const options = {
      key: "rzp_test_S0eeQglGbygi4C", // ONLY KEY ID
      amount: order.amount,
      currency: order.currency,
      name: "Prashant",
      description: "Resume Template",
      order_id: order.id,

      handler: function (response) {
        console.log("Payment Success:", response);

        showSuccessPopup(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          order.amount
        );

        // 🔐 VERIFY PAYMENT (BACKGROUND)
        fetch("https://razorpay-backend-ke6v.onrender.com/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        })
        .then(res => res.json())
        .then(data => console.log("Verify:", data))
        .catch(err => console.error("Verify error:", err));
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

    if (typeof Razorpay === "undefined") {
      alert("Razorpay SDK not loaded");
      return;
    }

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (err) {
      console.error("Payment Failed:", err);
      alert(err.error.description);
    });

    rzp.open();

  } catch (err) {
    console.error("Buy Now Error:", err);
    alert("Something went wrong. Check console.");
  }
}

// ✅ SUCCESS POPUP
function showSuccessPopup(orderId, paymentId, amountPaise) {
  document.getElementById("orderId").textContent = orderId;
  document.getElementById("paymentId").textContent = paymentId;
  document.getElementById("amount").textContent = (amountPaise / 100).toFixed(2);
  document.getElementById("date").textContent = new Date().toLocaleString();
  document.getElementById("successModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("successModal").style.display = "none";
}
